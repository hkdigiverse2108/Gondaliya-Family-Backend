"use strict"
/**
 * @author Pramit Mangukiya
 * @description Server and REST API config
 */
import * as bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors'
import path from 'path';
import { mongooseConnection } from './database'
import * as packageInfo from '../package.json'
import { router } from './Routes'
import { socketServer } from './helper';

const app = express();

// EJS View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors())
app.use(mongooseConnection)
app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Prevent non-existent uploads from falling through to the router and triggering 401 via userJWT
app.use('/uploads', (req, res) => {
    return res.status(404).json({
        success: false,
        status: 404,
        message: 'File not found'
    });
});
const health = (req, res) => {
    return res.status(200).json({
        message: `Gondaliya Family Server is Running, Server health is green`,
        app: packageInfo.name,
        version: packageInfo.version,
        description: packageInfo.description,
        author: packageInfo.author,
        license: packageInfo.license
    })
}
const bad_gateway = (req, res) => { return res.status(502).json({ status: 502, message: "Project Name Backend API Bad Gateway" }) }

app.get('/', health);
app.get('/health', health);
app.get('/isServerUp', (req, res) => {
    res.send('Server is running ');
});

app.use(router);

app.all(/.*/, bad_gateway);

export default socketServer(app);;


