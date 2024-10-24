const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Configuration de stockage pour multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dossier où les fichiers seront stockés
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom du fichier
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

// Route principale pour la page de téléchargement
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Démarrer le serveur
app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});




const { spawn } = require('child_process');

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        console.log('Fichier téléchargé : ', req.file);

        const put = spawn('wsl', 
            [
                '/usr/local/hadoop/bin/hdfs',
                'dfs',
                '-rm', 
                '-r',
                '/output',
                '&&',
                '/usr/local/hadoop/bin/hdfs', 
                'dfs', 
                '-copyFromLocal', 
                '/mnt/c/Users/capuc/Documents/Webtech/N5/java/td/express-hadoop-project/uploads/' + req.file.filename, 
                '/input',
                '&&',
                '/usr/local/hadoop/bin/hadoop',
                'jar',
                '/usr/local/hadoop/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.2.1.jar',
                'wordcount',
                '/input/' + req.file.filename,
                '/output',
                '&&',
                '/usr/local/hadoop/bin/hdfs',
                'dfs',
                '-copyToLocal',
                '/output/part-r-00000',
                '/mnt/c/Users/capuc/Documents/Webtech/N5/java/td/express-hadoop-project/output/',
                '&&',
                '/usr/local/hadoop/bin/hdfs',
                'dfs',
                '-rm', 
                '-r',
                '/output'
            ]
        ); 
        put.stdout.pipe(process.stdout);
        put.stderr.pipe(process.stderr);
        put.stdin.end();
    }
});


