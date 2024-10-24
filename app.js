const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const { spawn } = require('child_process');
const ejs = require('ejs');
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
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

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const fileBaseName = path.basename(req.file.filename, path.extname(req.file.filename));
        const outputFileName = `${fileBaseName}_output`;
        
        const put = spawn('wsl', 
            [
                '/usr/local/hadoop/bin/hdfs', 
                'dfs', 
                '-copyFromLocal', 
                `/mnt/c/Users/capuc/Documents/Webtech/N5/java/td/express-hadoop-project/uploads/${req.file.filename}`, 
                '/input',
                '&&',
                '/usr/local/hadoop/bin/hadoop',
                'jar',
                '/usr/local/hadoop/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.2.1.jar',
                'wordcount',
                `/input/${req.file.filename}`,
                '/output',
                '&&',
                '/usr/local/hadoop/bin/hdfs',
                'dfs',
                '-copyToLocal',
                '/output/part-r-00000',
                `/mnt/c/Users/capuc/Documents/Webtech/N5/java/td/express-hadoop-project/output/${outputFileName}`,
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

        res.redirect(`/loading/${outputFileName}`);
    }
});

// Route pour la page de chargement
app.get('/loading/:outputFileName', (req, res) => {
    const outputFileName = req.params.outputFileName;
    res.render('loading', { outputFileName });
});

// Route pour afficher les résultats
app.get('/result/:outputFileName', (req, res) => {
    const outputFileName = req.params.outputFileName;
    const filePath = `output/${outputFileName}`;

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier de résultats', err);
            return res.status(500).send('Erreur lors de la récupération des résultats');
        }

        res.render('result', {
            outputFileName: outputFileName,
            wordCountResults: data
        });
    });
});

app.get('/check-file/:outputFileName', (req, res) => {
    const outputFileName = req.params.outputFileName;
    const filePath = path.join(__dirname, 'output', outputFileName);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.json({ exists: false });
        }
        res.json({ exists: true });
    });
});
