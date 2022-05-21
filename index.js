const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hfl6b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("doctors-portal").collection("Services");
        const bookingCollection = client.db("doctors-portal").collection("booking");



        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });

        //warning+
        //// this is not the proper way to query 
        // after learning more about mongodb . use aggregate lookup , pipeline , match , group 
        app.get('/available', async (req, res) => {
            const date = req.query.date;

            //get all services
            const services = await serviceCollection.find().toArray();


            //get the booking of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            //step 3 for each service, find bookings for that service 
            // services.forEach(service => {
            //     const serviceBookings = bookings.filter(b => b.treatment == service.name);
            //     const books = serviceBookings.map(s => s.slot);
            //     service.books = books;
            //     const available = service.slots.filter(s => !books.includes(s))
            //     // service.booked = serviceBookings.map(s => s.slot);
            //     service.available = available;
            // })
            services.forEach(service => {
                const serivcesBooking = bookings.filter(b => b.treatment === service.name);
                const booked = serivcesBooking.map(s => s.slot);
                const available = service.slots.filter(slot => !booked.includes(slot));
                service.slots = available;
            })

            res.send(services);
        })

        /* 
         * API Naming Convention
         * app.get('/booking) // get all booking in this collection. or get more than one or by filter
         * app.get('/booking/:id) // get a specific booking  
         * app.post('/booking) // add a new booking 
         * app.patch('/booking:id) // 
         * app.delete('/booking:id) // 
        */
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking)
            return res.send({ success: true, result })
        })


    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Doctor Uncle')
});

app.listen(port, () => {
    console.log('Listing Port', port);
})