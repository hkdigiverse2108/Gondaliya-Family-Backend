"use strict"
/**
 * @author Pramit Mangukiya
 * @description Server and REST API config
 */
import * as bodyParser from 'body-parser';
import express from 'express';  
import http from 'http';
import cors from 'cors'
import { mongooseConnection} from './database'
import * as packageInfo from '../package.json'
import { router } from './Routes'
 
const app = express();


app.use(cors())
app.use(mongooseConnection)
app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))
const health = (req, res) => {
    return res.status(200).json({
        message: `Project Name Server is Running, Server health is green`,
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

let server = new http.Server(app);
export default server;
