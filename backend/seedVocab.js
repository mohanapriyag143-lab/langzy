const mongoose = require('mongoose');
const Progress = require('./models/Progress');
const User = require('./models/User');
require('dotenv').config();

// Complete word map for all 20 languages
const wordMap = {
    Spanish: [
        { word: 'Hola', translation: 'Hello' },
        { word: 'Adiós', translation: 'Goodbye' },
        { word: 'Gracias', translation: 'Thank you' },
        { word: 'Por favor', translation: 'Please' },
        { word: 'Sí', translation: 'Yes' },
        { word: 'No', translation: 'No' },
        { word: 'Amor', translation: 'Love' },
        { word: 'Feliz', translation: 'Happy' },
        { word: 'Triste', translation: 'Sad' },
        { word: 'Casa', translation: 'House' },
        { word: 'Agua', translation: 'Water' },
        { word: 'Rojo', translation: 'Red' }
    ],
    French: [
        { word: 'Bonjour', translation: 'Hello' },
        { word: 'Au revoir', translation: 'Goodbye' },
        { word: 'Merci', translation: 'Thank you' },
        { word: "S'il vous plaît", translation: 'Please' },
        { word: 'Oui', translation: 'Yes' },
        { word: 'Non', translation: 'No' },
        { word: 'Amour', translation: 'Love' },
        { word: 'Heureux', translation: 'Happy' },
        { word: 'Triste', translation: 'Sad' },
        { word: 'Maison', translation: 'House' },
        { word: 'Eau', translation: 'Water' },
        { word: 'Rouge', translation: 'Red' }
    ],
    German: [
        { word: 'Hallo', translation: 'Hello' },
        { word: 'Auf Wiedersehen', translation: 'Goodbye' },
        { word: 'Danke', translation: 'Thank you' },
        { word: 'Bitte', translation: 'Please' },
        { word: 'Ja', translation: 'Yes' },
        { word: 'Nein', translation: 'No' },
        { word: 'Liebe', translation: 'Love' },
        { word: 'Glücklich', translation: 'Happy' },
        { word: 'Traurig', translation: 'Sad' },
        { word: 'Haus', translation: 'House' },
        { word: 'Wasser', translation: 'Water' },
        { word: 'Rot', translation: 'Red' }
    ],
    Italian: [
        { word: 'Ciao', translation: 'Hello' },
        { word: 'Arrivederci', translation: 'Goodbye' },
        { word: 'Grazie', translation: 'Thank you' },
        { word: 'Per favore', translation: 'Please' },
        { word: 'Sì', translation: 'Yes' },
        { word: 'No', translation: 'No' },
        { word: 'Amore', translation: 'Love' },
        { word: 'Felice', translation: 'Happy' },
        { word: 'Triste', translation: 'Sad' },
        { word: 'Casa', translation: 'House' },
        { word: 'Acqua', translation: 'Water' },
        { word: 'Rosso', translation: 'Red' }
    ],
    Portuguese: [
        { word: 'Olá', translation: 'Hello' },
        { word: 'Adeus', translation: 'Goodbye' },
        { word: 'Obrigado', translation: 'Thank you' },
        { word: 'Por favor', translation: 'Please' },
        { word: 'Sim', translation: 'Yes' },
        { word: 'Não', translation: 'No' },
        { word: 'Amor', translation: 'Love' },
        { word: 'Feliz', translation: 'Happy' },
        { word: 'Triste', translation: 'Sad' },
        { word: 'Casa', translation: 'House' },
        { word: 'Água', translation: 'Water' },
        { word: 'Vermelho', translation: 'Red' }
    ],
    Tamil: [
        { word: 'Vanakkam', translation: 'Hello' },
        { word: 'Kalai Vanakkam', translation: 'Good Morning' },
        { word: 'Nandri', translation: 'Thank you' },
        { word: 'Thayavu Seithu', translation: 'Please' },
        { word: 'Aamam', translation: 'Yes' },
        { word: 'Illa', translation: 'No' },
        { word: 'Anbu', translation: 'Love' },
        { word: 'Makizhchi', translation: 'Happy' },
        { word: 'Dukham', translation: 'Sad' },
        { word: 'Veedu', translation: 'House' },
        { word: 'Thanneer', translation: 'Water' },
        { word: 'Sivappu', translation: 'Red' }
    ],
    Hindi: [
        { word: 'Namaste', translation: 'Hello' },
        { word: 'Alvida', translation: 'Goodbye' },
        { word: 'Dhanyavaad', translation: 'Thank you' },
        { word: 'Kripaya', translation: 'Please' },
        { word: 'Haan', translation: 'Yes' },
        { word: 'Nahi', translation: 'No' },
        { word: 'Pyaar', translation: 'Love' },
        { word: 'Khush', translation: 'Happy' },
        { word: 'Udaas', translation: 'Sad' },
        { word: 'Ghar', translation: 'House' },
        { word: 'Paani', translation: 'Water' },
        { word: 'Laal', translation: 'Red' }
    ],
    Telugu: [
        { word: 'Namaskaram', translation: 'Hello' },
        { word: 'Veltunna', translation: 'Goodbye' },
        { word: 'Dhanyavaadalu', translation: 'Thank you' },
        { word: 'Dayachesi', translation: 'Please' },
        { word: 'Avunu', translation: 'Yes' },
        { word: 'Kadu', translation: 'No' },
        { word: 'Prema', translation: 'Love' },
        { word: 'Santhosham', translation: 'Happy' },
        { word: 'Dukkham', translation: 'Sad' },
        { word: 'Illu', translation: 'House' },
        { word: 'Neeru', translation: 'Water' },
        { word: 'Erra', translation: 'Red' }
    ],
    Malayalam: [
        { word: 'Namaskaram', translation: 'Hello' },
        { word: 'Pokunnu', translation: 'Goodbye' },
        { word: 'Nandi', translation: 'Thank you' },
        { word: 'Dayavayi', translation: 'Please' },
        { word: 'Athe', translation: 'Yes' },
        { word: 'Alla', translation: 'No' },
        { word: 'Sneham', translation: 'Love' },
        { word: 'Santhosham', translation: 'Happy' },
        { word: 'Dukham', translation: 'Sad' },
        { word: 'Veedu', translation: 'House' },
        { word: 'Vellam', translation: 'Water' },
        { word: 'Chuvappu', translation: 'Red' }
    ],
    Kannada: [
        { word: 'Namaskara', translation: 'Hello' },
        { word: 'Hogi Baruttene', translation: 'Goodbye' },
        { word: 'Dhanyavadagalu', translation: 'Thank you' },
        { word: 'Dayavittu', translation: 'Please' },
        { word: 'Houdhu', translation: 'Yes' },
        { word: 'Illa', translation: 'No' },
        { word: 'Prema', translation: 'Love' },
        { word: 'Santhosha', translation: 'Happy' },
        { word: 'Dukha', translation: 'Sad' },
        { word: 'Mane', translation: 'House' },
        { word: 'Neeru', translation: 'Water' },
        { word: 'Kemppu', translation: 'Red' }
    ],
    Japanese: [
        { word: 'Konnichiwa', translation: 'Hello' },
        { word: 'Sayonara', translation: 'Goodbye' },
        { word: 'Arigatou', translation: 'Thank you' },
        { word: 'Onegaishimasu', translation: 'Please' },
        { word: 'Hai', translation: 'Yes' },
        { word: 'Iie', translation: 'No' },
        { word: 'Ai', translation: 'Love' },
        { word: 'Ureshii', translation: 'Happy' },
        { word: 'Kanashii', translation: 'Sad' },
        { word: 'Ie', translation: 'House' },
        { word: 'Mizu', translation: 'Water' },
        { word: 'Aka', translation: 'Red' }
    ],
    Chinese: [
        { word: 'Nǐ hǎo', translation: 'Hello' },
        { word: 'Zàijiàn', translation: 'Goodbye' },
        { word: 'Xièxiè', translation: 'Thank you' },
        { word: 'Qǐng', translation: 'Please' },
        { word: 'Shì', translation: 'Yes' },
        { word: 'Bù', translation: 'No' },
        { word: 'Ài', translation: 'Love' },
        { word: 'Kuàilè', translation: 'Happy' },
        { word: 'Nánguò', translation: 'Sad' },
        { word: 'Jiā', translation: 'House' },
        { word: 'Shuǐ', translation: 'Water' },
        { word: 'Hóng', translation: 'Red' }
    ],
    Korean: [
        { word: 'Annyeonghaseyo', translation: 'Hello' },
        { word: 'Annyeong', translation: 'Goodbye' },
        { word: 'Gamsahamnida', translation: 'Thank you' },
        { word: 'Juseyo', translation: 'Please' },
        { word: 'Ne', translation: 'Yes' },
        { word: 'Aniyo', translation: 'No' },
        { word: 'Sarang', translation: 'Love' },
        { word: 'Haengbok', translation: 'Happy' },
        { word: 'Seulpeum', translation: 'Sad' },
        { word: 'Jip', translation: 'House' },
        { word: 'Mul', translation: 'Water' },
        { word: 'Ppalggang', translation: 'Red' }
    ],
    Arabic: [
        { word: 'Marhaba', translation: 'Hello' },
        { word: 'Ma assalama', translation: 'Goodbye' },
        { word: 'Shukran', translation: 'Thank you' },
        { word: 'Min fadlak', translation: 'Please' },
        { word: "Na'am", translation: 'Yes' },
        { word: 'La', translation: 'No' },
        { word: 'Hubb', translation: 'Love' },
        { word: 'Saeed', translation: 'Happy' },
        { word: 'Hazeen', translation: 'Sad' },
        { word: 'Bayt', translation: 'House' },
        { word: 'Maa', translation: 'Water' },
        { word: 'Ahmar', translation: 'Red' }
    ],
    Russian: [
        { word: 'Privet', translation: 'Hello' },
        { word: 'Poka', translation: 'Goodbye' },
        { word: 'Spasibo', translation: 'Thank you' },
        { word: 'Pozhaluysta', translation: 'Please' },
        { word: 'Da', translation: 'Yes' },
        { word: 'Net', translation: 'No' },
        { word: 'Lyubov', translation: 'Love' },
        { word: 'Schastlivy', translation: 'Happy' },
        { word: 'Grustniy', translation: 'Sad' },
        { word: 'Dom', translation: 'House' },
        { word: 'Voda', translation: 'Water' },
        { word: 'Krasny', translation: 'Red' }
    ],
    Dutch: [
        { word: 'Hallo', translation: 'Hello' },
        { word: 'Tot ziens', translation: 'Goodbye' },
        { word: 'Dank je', translation: 'Thank you' },
        { word: 'Alsjeblieft', translation: 'Please' },
        { word: 'Ja', translation: 'Yes' },
        { word: 'Nee', translation: 'No' },
        { word: 'Liefde', translation: 'Love' },
        { word: 'Gelukkig', translation: 'Happy' },
        { word: 'Verdrietig', translation: 'Sad' },
        { word: 'Huis', translation: 'House' },
        { word: 'Water', translation: 'Water' },
        { word: 'Rood', translation: 'Red' }
    ],
    Swedish: [
        { word: 'Hej', translation: 'Hello' },
        { word: 'Hej då', translation: 'Goodbye' },
        { word: 'Tack', translation: 'Thank you' },
        { word: 'Snälla', translation: 'Please' },
        { word: 'Ja', translation: 'Yes' },
        { word: 'Nej', translation: 'No' },
        { word: 'Kärlek', translation: 'Love' },
        { word: 'Glad', translation: 'Happy' },
        { word: 'Ledsen', translation: 'Sad' },
        { word: 'Hus', translation: 'House' },
        { word: 'Vatten', translation: 'Water' },
        { word: 'Röd', translation: 'Red' }
    ],
    Turkish: [
        { word: 'Merhaba', translation: 'Hello' },
        { word: 'Hoşça kal', translation: 'Goodbye' },
        { word: 'Teşekkür ederim', translation: 'Thank you' },
        { word: 'Lütfen', translation: 'Please' },
        { word: 'Evet', translation: 'Yes' },
        { word: 'Hayır', translation: 'No' },
        { word: 'Aşk', translation: 'Love' },
        { word: 'Mutlu', translation: 'Happy' },
        { word: 'Üzgün', translation: 'Sad' },
        { word: 'Ev', translation: 'House' },
        { word: 'Su', translation: 'Water' },
        { word: 'Kırmızı', translation: 'Red' }
    ],
    Polish: [
        { word: 'Cześć', translation: 'Hello' },
        { word: 'Do widzenia', translation: 'Goodbye' },
        { word: 'Dziękuję', translation: 'Thank you' },
        { word: 'Proszę', translation: 'Please' },
        { word: 'Tak', translation: 'Yes' },
        { word: 'Nie', translation: 'No' },
        { word: 'Miłość', translation: 'Love' },
        { word: 'Szczęśliwy', translation: 'Happy' },
        { word: 'Smutny', translation: 'Sad' },
        { word: 'Dom', translation: 'House' },
        { word: 'Woda', translation: 'Water' },
        { word: 'Czerwony', translation: 'Red' }
    ],
    Greek: [
        { word: 'Yassas', translation: 'Hello' },
        { word: 'Andio', translation: 'Goodbye' },
        { word: 'Efharisto', translation: 'Thank you' },
        { word: 'Parakalo', translation: 'Please' },
        { word: 'Nai', translation: 'Yes' },
        { word: 'Ohi', translation: 'No' },
        { word: 'Agapi', translation: 'Love' },
        { word: 'Eftyhistos', translation: 'Happy' },
        { word: 'Tristos', translation: 'Sad' },
        { word: 'Spiti', translation: 'House' },
        { word: 'Nero', translation: 'Water' },
        { word: 'Kokkino', translation: 'Red' }
    ]
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const users = await User.find({});

    for (const user of users) {
        console.log(`\n📧 Seeding for user: ${user.email}`);

        // Seed ALL languages for every user
        for (const [lang, rawWords] of Object.entries(wordMap)) {
            const now = new Date();

            const starterWords = rawWords.map((w, i) => ({
                word: w.word,
                translation: w.translation,
                strength: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'faded' : 'broken',
                reviewCount: i % 3 === 0 ? 2 : 0,
                nextReview: i % 3 === 0 ? new Date(Date.now() + 3 * 86400000) : now,
                lastReviewed: i % 3 === 0 ? now : null
            }));

            const mastered = starterWords.filter(w => w.strength === 'gold').length;

            await Progress.findOneAndUpdate(
                { user: user._id, language: lang },
                { $set: { vocabularyList: starterWords, vocabularyMastered: mastered } },
                { upsert: true, new: true }
            );

            console.log(`  ✅ ${lang}: ${starterWords.length} words (${mastered} mastered)`);
        }
    }

    console.log('\n🎉 All languages seeded successfully for all users!');
    process.exit(0);
}).catch(err => {
    console.error(err.message);
    process.exit(1);
});
