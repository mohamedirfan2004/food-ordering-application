const Hero = require('../models/Hero');

// Get public hero settings (for Home page)
exports.getPublicHero = async (req, res) => {
  try {
    let hero = await Hero.findOne();
    if (!hero) {
      hero = await Hero.create({});
    }
    res.json(hero);
  } catch (err) {
    console.error('Error fetching hero:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get hero settings for admin
exports.getHero = async (req, res) => {
  try {
    let hero = await Hero.findOne();
    if (!hero) {
      hero = await Hero.create({});
    }
    res.json(hero);
  } catch (err) {
    console.error('Error fetching hero for admin:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update hero settings (admin)
exports.updateHero = async (req, res) => {
  try {
    const { title, subtitle, badge1, badge2, badge3, imageUrl } = req.body;

    let hero = await Hero.findOne();
    if (!hero) {
      hero = new Hero();
    }

    if (typeof title === 'string') hero.title = title;
    if (typeof subtitle === 'string') hero.subtitle = subtitle;
    if (typeof badge1 === 'string') hero.badge1 = badge1;
    if (typeof badge2 === 'string') hero.badge2 = badge2;
    if (typeof badge3 === 'string') hero.badge3 = badge3;
    if (typeof imageUrl === 'string') hero.imageUrl = imageUrl;

    await hero.save();
    res.json(hero);
  } catch (err) {
    console.error('Error updating hero:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
