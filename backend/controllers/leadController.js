const Lead = require('../models/Lead');
const { parseFile } = require('../utils/fileParser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// @desc    Upload leads from file
// @route   POST /api/lead/upload
// @access  Private/Agent
const uploadLeads = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    try {
        console.time('FullUploadProcess');
        
        // 1. Parse File
        console.time('ParseFile');
        const data = await parseFile(filePath);
        console.timeEnd('ParseFile');

        if (!data || data.length === 0) {
            throw new Error('File is empty or invalid');
        }

        console.log(`Preparing ${data.length} leads for injection...`);

        // 2. Map Data (Optimized loop)
        console.time('MappingData');
        const leadsToSave = [];
        const agentId = req.user._id;

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const rawMobile = String(item.mobile || item.Mobile || item.Phone || '');
            const mobile = rawMobile.replace(/\D/g, '');
            
            const pincode = String(item.pincode || item.Pincode || item.PIN || '');
            const lastDigit = parseInt(pincode.slice(-1));
            const type = (!isNaN(lastDigit) && lastDigit % 2 === 0) ? 'city' : 'village';

            leadsToSave.push({
                name: item.name || item.Name || 'Unnamed',
                mobile: mobile,
                pincode: pincode,
                type: type,
                agent_id: agentId,
                status: 'new',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.timeEnd('MappingData');

        // 3. Native Bulk Insertion (Bypass Mongoose overhead)
        console.time('NativeInsert');
        
        // Use native driver's insertMany for extreme speed
        // Batching for very large datasets to prevent buffer issues
        const batchSize = 5000;
        for (let i = 0; i < leadsToSave.length; i += batchSize) {
            const batch = leadsToSave.slice(i, i + batchSize);
            await Lead.collection.insertMany(batch, { ordered: false });
        }
        
        console.timeEnd('NativeInsert');
        console.timeEnd('FullUploadProcess');

        // 4. Cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(201).json({ 
            message: `${leadsToSave.length} leads uploaded and saved to MongoDB successfully`,
            count: leadsToSave.length 
        });

    } catch (error) {
        console.error('High-speed upload error:', error);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get agent leads
// @route   GET /api/lead
// @access  Private/Agent
const getAgentLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ agent_id: req.user._id });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const mongoose = require('mongoose');

// @desc    Mark lead as tricked
// @route   POST /api/lead/trick
// @access  Private/Agent
const markAsTricked = async (req, res) => {
    const { leadId } = req.body;

    try {
        if (!leadId) {
            return res.status(400).json({ message: 'Lead ID is required' });
        }

        const lead = await Lead.findById(new mongoose.Types.ObjectId(leadId));

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found in database' });
        }

        if (lead.agent_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this lead' });
        }

        lead.status = 'tricked';
        await lead.save();

        res.json({ message: 'Lead marked as tricked successfully' });
    } catch (error) {
        console.error('Trick Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send WhatsApp message
// @route   POST /api/lead/send-whatsapp
// @access  Private/Agent
const sendWhatsAppMessage = async (req, res) => {
    const { mobile } = req.body;

    try {
        const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`;
        const token = process.env.WHATSAPP_TOKEN;

        const messageText = `⚡EcoPlug Charging Station ⚡

Hello Sir/Ma’am 👋

As we discussed on the call, we are contacting you from EcoPlug Charging Station.

🚗🔌 EV (Electric Vehicle) demand is growing very fast, and starting a charging station is a good business opportunity.

💼 You can install an EcoPlug Charging Station at your location:
✔ Low investment
✔ High demand in future
✔ Full setup support
✔ Installation help

📍 If you have space (shop, petrol pump, parking, or open area), you can easily start this business.

🔗 For more details, connect with us:
📸 Instagram: https://instagram.com/ecopluglko.samgroup
📘 Facebook: https://facebook.com/EcoPluglkosamgroup
📧 Email: ecopluglko.samgroup@gmail.com

👉 If you are interested, please reply or continue chat on WhatsApp.

Thank you 🙏
Team EcoPlug ⚡`;

        const data = {
            messaging_product: "whatsapp",
            to: mobile,
            type: "text",
            text: {
                body: messageText
            }
        };

        // Note: Using 'text' type instead of 'template'. 
        // Business API usually requires a template for the first message.
        // If this fails, the user should ensure they have a template approved.

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ message: 'WhatsApp message sent', data: response.data });
    } catch (error) {
        console.error('WhatsApp API Error:', error.response ? JSON.stringify(error.response.data) : error.message);
        
        // If API fails, we still return success but with a flag so frontend can use wa.me fallback if desired
        res.status(500).json({ 
            message: 'Failed to send via API (Check your Token/Phone ID)', 
            error: error.response ? error.response.data : error.message 
        });
    }
};

module.exports = { uploadLeads, getAgentLeads, markAsTricked, sendWhatsAppMessage };
