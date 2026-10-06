// server.js - Uzirpur News Facebook Auto-Poster Backend
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.get('/', (req, res) => {
    res.send('Uzirpur News Auto-Poster Server is Running!');
});

app.post('/api/publish-facebook', async (req, res) => {
    try {
        const { imageBase64, headline, content, pageId, pageAccessToken } = req.body;

        if (!imageBase64 || !pageId || !pageAccessToken) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const caption = `${headline}\n\n${content || ''}\n\n#UzirpurNews #NewsUpdate`;

        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'news-card.png', contentType: 'image/png' });
        form.append('caption', caption);
        form.append('access_token', pageAccessToken);

        const fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${pageId}/photos`,
            form,
            { headers: form.getHeaders() }
        );

        const postId = fbResponse.data.post_id || fbResponse.data.id;
        if (postId) {
            try {
                await axios.post(
                    `https://graph.facebook.com/v19.0/${postId}/comments`,
                    {
                        message: 'বিস্তারিত জানতে আমাদের পেজে চোখ রাখুন।',
                        access_token: pageAccessToken
                    }
                );
            } catch (commentErr) {
                console.log('Comment post failed:', commentErr.message);
            }
        }

        return res.json({
            success: true,
            postId: postId,
            message: 'Successfully published to Facebook Page!'
        });

    } catch (error) {
        console.error('FB API Error:', error.response ? error.response.data : error.message);
        return res.status(500).json({
            success: false,
            error: error.response ? error.response.data.error.message : error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
