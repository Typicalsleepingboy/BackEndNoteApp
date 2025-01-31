const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../Midlleware/auth');
const upload = require('../Midlleware/upload');

router.post('/', auth, async (req, res) => {
    try {
        const note = new Note({
            ...req.body,
            userId: req.user._id
        });
        await note.save();
        res.status(201).send(note);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user._id });
        res.send(notes);
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/search/:query', auth, async (req, res) => {
    try {
        const notes = await Note.find({
            userId: req.user._id,
            $or: [
                { title: { $regex: req.params.query, $options: 'i' } },
                { content: { $regex: req.params.query, $options: 'i' } }
            ]
        });
        res.send(notes);
    } catch (error) {
        res.status(500).send();
    }
});
router.get('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.status(404).send();
        res.send(note);
    } catch (error) {
        res.status(500).send();
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!note) return res.status(404).send();
        res.send(note);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });
        if (!note) return res.status(404).send();
        res.send(note);
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/:id/attachment', auth, upload.single('file'), async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.status(404).send();
        
        note.attachments.push({
            type: req.body.type,
            url: `/uploads/${req.file.filename}`
        });
        
        await note.save();
        res.send(note);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/:id/share', auth, async (req, res) => {
    try {
        const { userId, permission } = req.body;
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!note) return res.status(404).send();
        
        note.shared.push({ userId, permission });
        await note.save();
        res.send(note);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;