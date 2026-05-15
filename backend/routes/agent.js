const express = require('express');
const router = express.Router();
const { streamText, tool } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

router.post('/chat', async (req, res) => {
  const { messages, sessionId, phone } = req.body;

  try {
    const result = streamText({
      model: google('gemini-1.5-pro'),
      system: `You are Digital Thozhan, a helpful assistant for Nanban Restaurant. 
Only recommend items returned by the menu tool. Do not hallucinate. 
When asked to add to cart, use the addToCart tool. 
If a user asks for something completely unrelated to the restaurant, politely decline.`,
      messages,
      maxSteps: 5,
      tools: {
        searchMenu: tool({
          description: 'Search the restaurant menu by query, category, or get all items if no query is provided.',
          parameters: z.object({
            query: z.string().optional().describe('Search query for food name or description'),
            category: z.string().optional().describe('Category to filter by (e.g. Starters, Main Course, Desserts)')
          }),
          execute: async ({ query, category }) => {
            const filter = { isAvailable: true };
            if (query) {
                filter.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
            if (category) {
                filter.category = { $regex: category, $options: 'i' };
            }
            const items = await FoodItem.find(filter).select('name description price category');
            return items.length > 0 ? items : { message: "No items found matching the criteria." };
          }
        }),
        addToCart: tool({
          description: 'Add an item to the user\'s cart.',
          parameters: z.object({
            foodItemName: z.string().describe('The exact name of the food item to add'),
            quantity: z.number().describe('Number of items to add')
          }),
          execute: async ({ foodItemName, quantity }) => {
            const item = await FoodItem.findOne({ name: new RegExp('^' + foodItemName + '$', 'i') });
            if (!item) return { success: false, message: 'Item not found in menu.' };
            
            const currentSessionId = sessionId || 'default-session';
            let cart = await Cart.findOne({ sessionId: currentSessionId });
            if (!cart) cart = new Cart({ sessionId: currentSessionId, items: [], totalAmount: 0 });
            
            const existingItem = cart.items.find(i => i.foodItem.toString() === item._id.toString());
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    foodItem: item._id,
                    quantity,
                    price: item.price,
                    name: item.name,
                    image: item.image
                });
            }
            cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            await cart.save();
            
            return { success: true, message: `Added ${quantity} ${item.name} to cart.`, addedItem: { ...item.toObject(), quantity } };
          }
        }),
        findMealsByFilter: tool({
          description: 'Suggest meals based on a user\'s budget or dietary needs.',
          parameters: z.object({
            maxBudget: z.number().optional().describe('Maximum budget in currency'),
            dietaryNeed: z.string().optional().describe('Dietary need, e.g. veg, non-veg, vegan')
          }),
          execute: async ({ maxBudget, dietaryNeed }) => {
             const filter = { isAvailable: true };
             if (maxBudget) {
                 filter.price = { $lte: maxBudget };
             }
             if (dietaryNeed) {
                 filter.$or = [
                     { description: { $regex: dietaryNeed, $options: 'i' } },
                     { category: { $regex: dietaryNeed, $options: 'i' } },
                     { name: { $regex: dietaryNeed, $options: 'i' } }
                 ];
             }
             const items = await FoodItem.find(filter).select('name description price category').limit(5);
             return items.length > 0 ? items : { message: "No meals found matching these preferences." };
          }
        }),
        getUserOrderHistory: tool({
            description: 'Fetch a user\'s past order history using their phone number.',
            parameters: z.object({
                phone: z.string().describe('User\'s phone number')
            }),
            execute: async ({ phone }) => {
                const orders = await Order.find({ phone }).sort({ createdAt: -1 }).limit(3);
                return orders.length > 0 ? orders : { message: "No past orders found for this phone number." };
            }
        }),
        reorderItems: tool({
            description: 'Duplicate a past order into the current cart using the orderNumber.',
            parameters: z.object({
                orderNumber: z.string().describe('The order number to reorder')
            }),
            execute: async ({ orderNumber }) => {
                const order = await Order.findOne({ orderNumber });
                if (!order) return { success: false, message: 'Order not found.' };
                
                const currentSessionId = sessionId || 'default-session';
                let cart = await Cart.findOne({ sessionId: currentSessionId });
                if (!cart) cart = new Cart({ sessionId: currentSessionId, items: [], totalAmount: 0 });
                
                const addedItems = [];
                for (const item of order.items) {
                    const existingItem = cart.items.find(i => i.foodItem.toString() === item.foodItem.toString());
                    if (existingItem) {
                        existingItem.quantity += item.quantity;
                    } else {
                        cart.items.push(item);
                    }
                    addedItems.push(item);
                }
                cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                await cart.save();
                
                return { success: true, message: `Reordered items from order ${orderNumber}.`, reorderedItems: addedItems };
            }
        }),
        getOrderStatus: tool({
            description: 'Check the status of an active order using the orderNumber.',
            parameters: z.object({
                orderNumber: z.string().describe('The order number to check status for')
            }),
            execute: async ({ orderNumber }) => {
                const order = await Order.findOne({ orderNumber }).select('orderNumber status totalAmount createdAt');
                if (!order) return { error: 'Order not found' };
                return order;
            }
        }),
        modifyActiveOrder: tool({
            description: 'Modify an active order (e.g., removing an item). Can only be done if order status is pending.',
            parameters: z.object({
                orderNumber: z.string().describe('The order number to modify'),
                action: z.enum(['remove_item']).describe('Action to perform'),
                foodItemName: z.string().describe('The name of the food item to remove')
            }),
            execute: async ({ orderNumber, action, foodItemName }) => {
                const order = await Order.findOne({ orderNumber });
                if (!order) return { success: false, message: 'Order not found' };
                if (order.status !== 'pending') return { success: false, message: `Cannot modify order. Current status is ${order.status}` };
                
                if (action === 'remove_item') {
                    const initialLength = order.items.length;
                    order.items = order.items.filter(item => !item.name.toLowerCase().includes(foodItemName.toLowerCase()));
                    if (order.items.length === initialLength) {
                        return { success: false, message: `Item ${foodItemName} not found in order` };
                    }
                    order.totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    await order.save();
                    return { success: true, message: `Removed ${foodItemName} from order. New total is ${order.totalAmount}` };
                }
                return { success: false, message: 'Invalid action' };
            }
        })
      }
    });

    if (result.pipeDataStreamToResponse) {
      result.pipeDataStreamToResponse(res);
    } else if (result.pipeUIMessageStreamToResponse) {
      result.pipeUIMessageStreamToResponse(res);
    } else if (result.toDataStreamResponse) {
      const dataStreamResponse = result.toDataStreamResponse();
      dataStreamResponse.body.pipe(res);
    } else {
      res.status(500).json({ error: 'Unsupported AI SDK version, missing stream response method.' });
    }
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat', stack: error.stack, details: JSON.stringify(error) });
  }
});

module.exports = router;
