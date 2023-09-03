var express = require('express');
var router = express.Router();
const mysql = require('mysql');


// create MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 200,
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'easy_vat',
  acquireTimeout: 1000000
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

function generateRandom(max) {
 // generate random number 
 if(max==0){
  return 0;
 }
  let rand = Math.random() * max;
  return Math.floor(rand);
}

// POST API to create a new client record
router.post('/client/create', (req, res) => {
  const { clientName, panNo, clientAddress, isVat, isAlcohol, amount, amountLimit } = req.body;

  // insert query to create new record in the MySQL database
  const insertQuery = `INSERT INTO clients (name, panNo, address, isVat, isAlcohol, amount, amountLimit) 
      VALUES ('${clientName}', '${panNo}', '${clientAddress}', ${isVat}, ${isAlcohol}, ${amount}, ${amountLimit})`;

      console.log(`isAlcohol:${isAlcohol}`)
  // execute the insert query on MySQL connection pool
  pool.query(insertQuery, (err, result) => {
      if (err) {
          console.error(`Error creating client record: ${err}`);
          res.status(500).send(`Error creating client record: ${err}`);
          return;
      }

      console.log(`Client record created with ID: ${result.insertId}`);
      res.status(200).send(`Client record created with ID: ${result.insertId}`);
  });
});

// PUT API to update an existing client record
router.put('/client/update/:id', (req, res) => {
  const { id } = req.params;
  const { name, panNo, address, isVat, amount, amountLimit } = req.body;

  // update query to modify an existing record in the MySQL database
  const updateQuery = `UPDATE clients SET 
      name='${name}', panNo='${panNo}', address='${address}', isVat=${isVat}, amount=${amount}, amountLimit=${amountLimit}
      WHERE id=${id}`;

  // execute the update query on MySQL connection pool
  pool.query(updateQuery, (err, result) => {
      if (err) {
          console.error(`Error updating client record: ${err}`);
          res.status(500).send(`Error updating client record: ${err}`);
          return;
      }

      console.log(`Client record updated with ID: ${id}`);
      res.status(200).send(`Client record updated with ID: ${id}`);
  });
});

// GET API to retrieve client information by ID
router.get('/client/:id', (req, res) => {
  const { id } = req.params;

  // select query to retrieve client information from the MySQL database
  const selectQuery = `SELECT * FROM clients WHERE id=${id}`;

  // execute the select query on MySQL connection pool
  pool.query(selectQuery, (err, result) => {
      if (err) {
          console.error(`Error retrieving client information: ${err}`);
          res.status(500).send(`Error retrieving client information: ${err}`);
          return;
      }

      if (result.length === 0) {
          console.log(`Client record not found with ID: ${id}`);
          res.status(404).send(`Client record not found with ID: ${id}`);
          return;
      }

      console.log(`Client record found with ID: ${id}`);
      res.status(200).send(result[0]);
  });
});

// GET API to retrieve all clients
// GET API to retrieve all clients
router.get('/clients', (req, res) => {
    // select query to retrieve all clients from the MySQL database
    const selectQuery = 'SELECT * FROM clients order by amount desc';

    // execute the select query on MySQL connection pool
    pool.query(selectQuery, (err, result) => {
        if (err) {
            console.error(`Error retrieving clients: ${err}`);
            res.status(500).send(`Error retrieving clients: ${err}`);
            return;
        }

        console.log(`Retrieved ${result.length} clients from the database`);
        res.status(200).send(result);
    });
});

// POST API to add a new sell to the sells table
router.post('/sells', (req, res) => {
  const billNo = req.body.billNo;
  const amount = req.body.amount;
  const isAlcohol = req.body.isAlcohol;
  const vatAmount = req.body.vatAmount;
  const totalAmount = req.body.totalAmount || (amount + vatAmount); // Calculate totalAmount if not provided

  // insert query to add a new sell to the sells table
  const insertQuery = `INSERT INTO sells (billNo, isAlcohol, amount, vatAmount, totalAmount) VALUES ('${billNo}', '${isAlcohol}', ${amount}, ${vatAmount}, ${totalAmount})`;

  // execute the insert query on MySQL connection pool
  pool.query(insertQuery, (err, results) => {
    if (err) {
      console.error(`Error adding sell: ${err}`);
      res.status(500).send(`Error adding sell: ${err}`);
      return;
    }

    console.log(`Sell ${billNo} added to the sells table`);
    rand = generateRandom();
    allocateSells(rand-1,rand+2,{totalAmount,billNo,isAlcohol})
    res.status(200).send(`Sell ${billNo} added to the sells table`);
  });
});

// PUT API to update an existing bill in the sells table
router.put('/sells/:billNo', (req, res) => {
  const billNo = req.params.billNo;
  const { amount, vatAmount, totalAmount } = req.body;

  // update query to update an existing bill in the sells table
  const updateQuery = `UPDATE sells 
                       SET amount = '${amount}', vatAmount = '${vatAmount}', totalAmount = '${totalAmount}'
                       WHERE billNo = '${billNo}'`;

  // execute the update query on MySQL connection pool
  pool.query(updateQuery, (err, result) => {
    if (err) {
      console.error(`Error updating bill: ${err}`);
      res.status(500).send(`Error updating bill: ${err}`);
      return;
    }

    if (result.affectedRows === 0) {
      console.log(`Bill ${billNo} not found in the sells table`);
      res.status(404).send(`Bill ${billNo} not found in the sells table`);
      return;
    }

    console.log(`Updated bill ${billNo} in the sells table`);
    res.status(200).send(`Updated bill ${billNo} in the sells table`);
  });
});

// GET API to list all bills in the sells table
router.get('/sells', (req, res) => {
  // select query to list all bills in the sells table
  const selectQuery = 'SELECT s.id ,s.billNo, s.isAlcohol, s.amount as sa, s.vatAmount, s.totalAmount, c.* FROM sells s left join clients c on s.clientId = c.Id';

  // execute the select query on MySQL connection pool
  pool.query(selectQuery, (err, results) => {
    if (err) {
      console.error(`Error fetching bills: ${err}`);
      res.status(500).send(`Error fetching bills: ${err}`);
      return;
    }

    console.log(`Fetched ${results.length} bills from the sells table`);
    console.log(results);
    res.status(200).json(results);
  });
});

// GET API to list a specific bill by billNo in the sells table
router.get('/sells/:billNo', (req, res) => {
  const billNo = req.params.billNo;

  // select query to fetch a specific bill by billNo in the sells table
  const selectQuery = `SELECT * FROM sells WHERE billNo = '${billNo}'`;

  // execute the select query on MySQL connection pool
  pool.query(selectQuery, (err, results) => {
    if (err) {
      console.error(`Error fetching bill ${billNo}: ${err}`);
      res.status(500).send(`Error fetching bill ${billNo}: ${err}`);
      return;
    }

    if (results.length === 0) {
      console.log(`Bill ${billNo} not found in the sells table`);
      res.status(404).send(`Bill ${billNo} not found in the sells table`);
      return;
    }

    console.log(`Fetched bill ${billNo} from the sells table`);
    res.status(200).json(results[0]);
  });
});

router.get('/rps', (req, res) => {
  const selectQuery = `SELECT distinct billNo, id, amount, vatAmount, totalAmount, clientId, isAlcohol FROM easy_vat.sells where clientId is null`;
  // execute the select query on MySQL connection pool
  getSells(selectQuery);
  res.status(200).json('Successfull');
 });

async function getSells(selectQuery) {
  let usedSells = new Set();
  const results = await execute(selectQuery);
  for (var i = results.length - 1; i >= 0; i--) {
    const sell = results[i];
    if(usedSells.has(sell.billNo)) {
      console.log(`duplicate pan no ${sell.billNo}`)
    } else {
      usedSells.add(sell.billNo);
      queryString = `SELECT distinct id, name, panNo, amount, amountLimit, isAlcohol, isUsed FROM easy_vat.clients c WHERE (c.amount + ${sell.totalAmount}) < c.amountLimit`;
      if(sell.isAlcohol) {
        queryString = queryString + ` AND isAlcohol is true`
      }
      clients = await execute(queryString);
      if (clients.length > 1) {
        rand = generateRandom(clients.length-1);
        const client = clients[rand];
        if (typeof client != "undefined" || client != null) {
          const updatedClientAmount = client.amount + sell.totalAmount;
          const updateQuery = `UPDATE clients SET amount = '${updatedClientAmount}', isUsed = 1 WHERE id = '${client.id}'`;
          await execute(updateQuery);
          sell.clientId = client.id;
          const updateQuerysells = `UPDATE sells SET clientId = '${client.id}' WHERE billNo = '${sell.billNo}'`;
          await execute(updateQuerysells);
          } else {
            console.log(`client is empty'`)
          }      
        }  else {
        console.log(`client list is empty for sell '${sell.billNo}', '${sell.amount}, '${sell.totalAmount}, '${sell.isAlcohol}'`)
      }
    }
  }
}

const execute = (query) => {
  return new Promise((resove, reject) => {
      pool.query(query,
          function (err, rows) {
              if (err) reject(err);
              resove(rows);
          });
  });
}

module.exports = router;