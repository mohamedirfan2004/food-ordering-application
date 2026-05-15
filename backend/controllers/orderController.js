const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const Customer = require('../models/Customer');

// Basic phone normalization (kept for backwards compatibility with existing Customer records)
const formatPhoneNumber = (phone) => {
	const cleaned = phone.replace(/\D/g, '');
	if (cleaned.startsWith('0')) {
		return `+91${cleaned.substring(1)}`;
	}
	if (cleaned.startsWith('91') && cleaned.length === 12) {
		return `+${cleaned}`;
	}
	if (cleaned.length === 10) {
		return `+91${cleaned}`;
	}
	return `+${cleaned}`;
};

// Determine if a menu item is currently available based on manual flag and schedule
const isFoodItemAvailableNow = (foodItem) => {
    if (!foodItem) return false;

    // Manual disable always wins
    if (foodItem.isAvailable === false) return false;

    // Default: always available
    if (!foodItem.availabilityType || foodItem.availabilityType === 'always') {
        return true;
    }

    // Scheduled availability using local server time (HH:MM)
    const start = foodItem.scheduleStart;
    const end = foodItem.scheduleEnd;
    if (!start || !end) return false;

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some(v => Number.isNaN(v))) return false;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    // Support windows that may cross midnight (e.g. 22:00–02:00)
    if (startMinutes <= endMinutes) {
        return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

// @desc    Create a new order or append to an existing open order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
    try {
        const { customerName, phone, address, table, items, totalAmount, specialInstructions, orderNumber } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Normalize phone and ensure a Customer record exists (no OTP required)
        const formattedPhone = formatPhoneNumber(phone);
        let customer = await Customer.findOne({ phone: formattedPhone });

        if (!customer) {
            customer = new Customer({
                phone: formattedPhone,
                isVerified: true,
                name: customerName || undefined,
            });
            await customer.save();
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order items are required' });
        }

        // Create order items array with food item details and validate availability
        const unavailableNames = [];
        const orderItems = await Promise.all(items.map(async (item) => {
            const foodItem = await FoodItem.findById(item.foodItem);
            if (!foodItem) throw new Error('Food item not found');

            if (!isFoodItemAvailableNow(foodItem)) {
                unavailableNames.push(foodItem.name || 'Unknown item');
            }

            return {
                foodItem: item.foodItem,
                quantity: item.quantity,
                price: foodItem.price,
                name: foodItem.name,
                image: foodItem.image
            };
        }));

        if (unavailableNames.length > 0) {
            return res.status(400).json({
                message: `The following items are not available at this time: ${unavailableNames.join(', ')}`,
            });
        }

        // Try to find an existing open order for this customer
        let existingOrder = null;

        // 1) Prefer explicit orderNumber if provided
        if (orderNumber) {
            existingOrder = await Order.findOne({
                orderNumber,
                status: { $in: ['pending', 'preparing'] }
            });
        }

        // 2) Otherwise, match on phone + table for open orders
        if (!existingOrder) {
            const tableValue = table || '';
            existingOrder = await Order.findOne({
                phone,
                table: tableValue,
                status: { $in: ['pending', 'preparing'] }
            }).sort({ createdAt: -1 });
        }

        if (existingOrder) {
            // Append new items to existing order without merging quantities
            orderItems.forEach(newItem => {
                newItem.isNewItem = true;
                existingOrder.items.push(newItem);
            });

            // Recalculate totalAmount on the server
            existingOrder.totalAmount = existingOrder.items.reduce(
                (sum, it) => sum + (it.price * it.quantity),
                0
            );

            // Optionally append special instructions
            if (specialInstructions) {
                if (existingOrder.specialInstructions) {
                    existingOrder.specialInstructions = `${existingOrder.specialInstructions}\n${specialInstructions}`;
                } else {
                    existingOrder.specialInstructions = specialInstructions;
                }
            }

            // Keep customer name filled if previously empty
            if (customerName && !existingOrder.customerName) {
                existingOrder.customerName = customerName;
            }

            // Ensure this order is linked in the customer's history
            if (!customer.orders.some(id => id.equals(existingOrder._id))) {
                customer.orders.push(existingOrder._id);
                if (customerName && !customer.name) {
                    customer.name = customerName;
                }
                await customer.save();
            }

            const updatedOrder = await existingOrder.save();
            
            // Real-time update: emit event for new items added
            const io = req.app.get('io');
            if (io) {
                io.emit('orderStatusChanged', updatedOrder);
            }

            return res.status(200).json(updatedOrder);
        }

        // No existing open order – create a new one
        const computedTotal = orderItems.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        );

        const order = new Order({
            customerName,
            phone,
            address,
            table: table || '',
            items: orderItems,
            totalAmount: computedTotal,
            specialInstructions: specialInstructions || ''
        });

        const createdOrder = await order.save();

        // Attach order to customer history
        customer.orders.push(createdOrder._id);
        if (customerName && !customer.name) {
            customer.name = customerName;
        }
        await customer.save();

        res.status(201).json(createdOrder);

        // Real-time update: emit event for brand new order
        const io = req.app.get('io');
        if (io) {
            io.emit('newOrder', createdOrder);
        }
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Public order tracking by phone or order number
// @route   GET /api/orders/track?phone=... or ?orderNumber=...
// @access  Public
exports.trackOrders = async (req, res) => {
    try {
        const { phone, orderNumber } = req.query;
        if (!phone && !orderNumber) {
            return res.status(400).json({ message: 'Provide phone or orderNumber' });
        }

        const query = orderNumber ? { orderNumber } : { phone };
        const orders = await Order.find(query).sort({ createdAt: -1 }).limit(10);
        res.json(orders);
    } catch (err) {
        console.error('Error tracking orders:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private/Admin
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);

        // Real-time update: emit event for status change
        const io = req.app.get('io');
        if (io) {
            io.emit('orderStatusChanged', order);
        }
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Merge new items into an existing order
// @route   PUT /api/orders/merge/:id
// @access  Public
exports.mergeItems = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items are required to append' });
        }

        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Validate items and get details
        const unavailableNames = [];
        const newItems = await Promise.all(items.map(async (item) => {
            const foodItem = await FoodItem.findById(item.foodItem);
            if (!foodItem) throw new Error('Food item not found');

            if (!isFoodItemAvailableNow(foodItem)) {
                unavailableNames.push(foodItem.name || 'Unknown item');
            }

            return {
                foodItem: item.foodItem,
                quantity: item.quantity,
                price: foodItem.price,
                name: foodItem.name,
                image: foodItem.image,
                isNewItem: true // Tag as new for admin
            };
        }));

        if (unavailableNames.length > 0) {
            return res.status(400).json({
                message: `The following items are not available at this time: ${unavailableNames.join(', ')}`,
            });
        }

        // Append without merging quantities to keep "New" items distinct
        existingOrder.items.push(...newItems);

        // Recalculate total amount
        existingOrder.totalAmount = existingOrder.items.reduce(
            (sum, it) => sum + (it.price * it.quantity),
            0
        );

        const updatedOrder = await existingOrder.save();
        res.status(200).json(updatedOrder);

        // Real-time update: emit event for merged items
        const io = req.app.get('io');
        if (io) {
            io.emit('orderStatusChanged', updatedOrder);
        }

    } catch (err) {
        console.error('Error appending to order:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Acknowledge new items in an order
// @route   PUT /api/orders/:id/acknowledge
// @access  Private/Admin
exports.acknowledgeNewItems = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Set isNewItem to false for all items
        order.items.forEach(item => {
            item.isNewItem = false;
        });

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);

    } catch (err) {
        console.error('Error acknowledging new items:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
