const express = require('express')
const {create} = require('ipfs-http-client')
const expFileUpload = require('express-fileupload')
const fs = require('fs')
const {ethers} = require('ethers')

const ipfs = create('http://localhost:5001')
const app = express()
app.use(expFileUpload())

app.get('/created', (req, res) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    console.log(provider)
    res.send(req.query.hash)
})

app.post('/upload', (req, res) => {
    let fileObj = {}
    if (req.files.inputFile) {
        const file = req.files.inputFile
        const fileName = file.name
        const filePath = __dirname + '/files/' + fileName
        // Move uploaded file to directory/files/uploadedfilename
        // directory `files` already have to be created before uploading
        file.mv(filePath, async (err) => {
            if(err) {
                console.log('Error: failed to download file')
                return res.status(500).send(err)
            }
            // e.x. cid = `QmRYQK3MxEtxcZhhfE3Ht9uAn6DM5q9rFJ1tx3AKANzrUZ`
            const fileHash = await addFile(fileName, filePath)
            console.log('File Hash received __>', fileHash)
            fs.unlink(filePath, (err) => {
                if(err) {
                    console.log("Error: Unable to delete file.", err)
                }
            })
            // fileObj = {
            //     file: file,
            //     name: fileName,
            //     path: filePath
            // }
        })
    } else {
        res.send('file upload false')
    }
})

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath)
    const filesAdded = await ipfs.add({
        path: fileName,
        content: file
    },
    {
        progress: (len) => console.log('Uploading file ... ' + len)
    })
    console.log(filesAdded)
    const fileHash = filesAdded.cid
    console.log(fileHash)
    return fileHash
}

app.listen(3000, () => {
    console.log('Server is listening on the port 3000')
})