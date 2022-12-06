require('dotenv').config();

const fs = require('fs');
const fsPath = require('path');

init();

if ( (config.clearDownloads == false) && (config.clearTrash == false) )
{
    console.log('Nothing to cleanup');
    process.exit();
}

const downloadsDir = {
    filesPaths: [],
    filesStats: {
        count: 0,
        sizeInBytes: 0,

        get sizeInHuman()
        {
            return this._convertFileSizeToHumanFormat();
        },

        _convertFileSizeToHumanFormat()
        {
            //let size = this.sizeInBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            let size = this.sizeInBytes;

            // Bytes
            if ( size < 1024 )
            {
                size = size.toString() + ' Байт';
            }
            else if ( size < Math.pow( 1024, 2) )
            {
                size = Math.round( (size / 1024).toString() ) + ' КБ';
            }
            else if ( size < Math.pow( 1024, 3) )
            {
                size = Math.round( (size / Math.pow( 1024, 2)) ).toString() + ' MБ';
            }
            else if ( size < Math.pow( 1024, 4) )
            {
                size = Math.round( (size / Math.pow( 1024, 3)) ).toString() + ' ГБ';
            }

            return size;
        },
    },

    getPath()
    {
        return fsPath.join( process.env.HOME, config.downloadsDirName );
    },

    scanFiles()
    {
        this.filesPaths = this._scanFiles(this.getPath());
    },

    _scanFiles(path)
    {
        let pathsList = [];

        let filesList = fs.readdirSync(path, { withFileTypes: true });

        for(let file of filesList)
        {
            if (file.isFile())
            {
                pathsList.push(file.name);
            }
            else if (file.isDirectory())
            {
                let subFiles = this._scanFiles( fsPath.join(path, file.name) );
                pathsList = pathsList.concat(
                    subFiles.map( fileName => fsPath.join(file.name, fileName) )
                );
            }
            else
            {
                throw new Error(`Unknown file type of file "${file.name}"`);
            }
        }

        return pathsList;
    },

    calcStats()
    {
        this.filesStats.count = this.filesPaths.length;

        const rootPath = this.getPath();

        this.filesPaths.forEach((fileName) => {
            let fileStats = fs.statSync( fsPath.join( rootPath, fileName ) );
            this.filesStats.sizeInBytes += fileStats.size;
        });
    },
};

downloadsDir.scanFiles();
downloadsDir.calcStats();

console.dir(downloadsDir.filesPaths);
console.dir(downloadsDir.filesStats);
console.dir(downloadsDir.filesStats.sizeInHuman);

function init()
{
    const config = getConfig();
    globalThis.config = config;
    
    console.log('Configuration:');
    console.dir(config);
    console.log("");
}

function getConfig()
{
    let config = {};

    config.clearDownloads = process.env.CLEAR_DOWNLOADS == undefined ? true : (process.env.CLEAR_DOWNLOADS == 'Y');
    config.clearTrash = process.env.CLEAR_TRASH == undefined ? true : (process.env.CLEAR_TRASH == 'Y');

    config.downloadsDirName = process.env.DOWNLOADS_DIR_NAME || 'Downloads';

    return config;
}

