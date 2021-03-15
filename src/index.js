const { response } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())


const customers = []

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        }
        else {
            return acc - operation.amount
        }
    }, 0)

    return balance
}

function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf)

    if (!customer) {
        return response.status(400).json({ error: "Invalid Customer Information" })
    }

    request.customer = customer;

    return next()
}

//Criar conta do cliente
app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

    if (customerAlreadyExists) {
        return response.status(400).json({ error: 'Customer Already Exists!' })
    }


    customers.push({
        name,
        cpf,
        id: uuidv4(),
        statement: [],
    })



    return response.status(201).send()
})

//Criar Deposito na Conta
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    };

    customer.statement.push(statementOperation)

    return response.status(201).send();
})

//Criar Saque na Conta
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body
    const { customer } = request

    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficient funds!" })
    }


    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})


//Listar Extrato por CPF
app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    return response.json(customer.statement)
})





app.listen(3333)
