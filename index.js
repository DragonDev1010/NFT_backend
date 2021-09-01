const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const _ = require('lodash')
const {create} = require('ipfs-http-client')
const fs = require('fs');

const ipfs = create("http://localhost:5001")
const app = express()

app.use(fileUpload({
    createParentPath: true
}))

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan('dev'))

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(__dirname)
    console.log(`App is listening on port ${port}.`)
})
app.get('/', async(req, res) => {
    console.log("Console is working")
    res.send("App is working")
})
app.post('/upload-avatar', async(req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file upload'
            })
        } else {
            let avatar = req.files.avatar

            avatar.mv('./files/' + avatar.name)
            let filePath = __dirname + "/files/" + avatar.name
            // const fileHash = await addFile(avatar.name, filePath)
            // console.log('IPFS Hash Value: ', fileHash)
            res.send({
                status: true,
                message: 'File is upload',
                data: {
                    name: avatar.name,
                    mimetype: avatar.mimetype,
                    size: avatar.size
                }
            })
        } 
    }catch(err) {
        res.status(500).send(err)
    }
})

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath)
    const filesAdded = await ipfs.add(
        {path: fileName, content: file},
        {progress: (len) => console.log("uploading file ... " + len)}
    )
    console.log(filesAdded)
    const fileHash = filesAdded.cid.toString
    return fileHash
}