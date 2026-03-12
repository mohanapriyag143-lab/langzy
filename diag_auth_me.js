const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'mohanapriyag143@gmail.com' });

        if (!user) {
            console.log("User not found");
            process.exit(0);
        }

        console.log("USER DATA FOR:", user.name);
        console.log("Streak:", user.streak);
        console.log("Level:", user.level);
        console.log("XP:", user.xp);
        console.log("Weekly XP:", user.weeklyXP);

        const meResponse = {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                weeklyXP: user.weeklyXP
            }
        };
        console.log("JSON:", JSON.stringify(meResponse));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
