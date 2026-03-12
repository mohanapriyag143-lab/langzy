// Script to fix corrupted currentLanguage field in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

async function fixLanguage() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Use raw collection to bypass Mongoose schema validation
    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Find all users where currentLanguage is an object
    const result = await users.find({
        currentLanguage: { $type: 'object' }
    }).toArray();

    console.log(`Found ${result.length} users with object currentLanguage`);

    for (const user of result) {
        const lang = user.currentLanguage;
        const newLang = lang?.code || lang?.name || null;

        await users.updateOne(
            { _id: user._id },
            { $set: { currentLanguage: newLang } }
        );
        console.log(`Fixed user ${user.email}: ${JSON.stringify(lang)} → "${newLang}"`);
    }

    console.log('✅ Fix complete!');
    await mongoose.disconnect();
}

fixLanguage().catch(console.error);
