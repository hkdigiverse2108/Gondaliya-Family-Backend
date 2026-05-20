import 'dotenv/config';
import server from './src';
import { initApp } from './src/helper/startup';

const port = process.env.PORT || 80;

initApp().then(() => {
    server.listen(port, () => {
        console.log(`server started on port ${port}`);
    });
});