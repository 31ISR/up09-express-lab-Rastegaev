const express = require("express")
const db = require("./db")
const bcr = require("bcryptjs")
const app = express()
const SECRET = "dfgdgf"
const jwt = require("jsonwebtoken")
app.use(express.json())
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization


    if (!authHeader) return res.status(401)
        .json({ error: "missing auth header" })
    const token = authHeader.split(" ")[1]
    if (!token) return res.status(401).json({ error: "wrong token format" })
    try {
        const decoded = jwt.verify(token, SECRET)
        req.user = decoded
        next()
    } catch (error) {
        console.error(error)

    }
}
app.post("/api/auth/register", (req, res) => {
    const { email, username, password, role } = req.body
    try {
        if (!email || !username || !password)
            return res
                .status(400)
                .json({ error: "Не хватает папы" })
        const syncSalt = bcr.genSaltSync(10)
        const hashed = bcr.hashSync(password, syncSalt)
        const query = db.prepare(`INSERT INTO User (username, email, password,role) VALUES (?, ?, ?, ?)`).run(username, email, hashed, role)
        const newUser = db.prepare("SELECT * FROM User WHERE id  = ?").get(query.lastInsertRowid)
        const { password: _, ...safeUser } = newUser
        res.status(201).json(safeUser)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Что-то пошло не так" })
    }
})
app.post("/api/auth/login", (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: "я не вижу че там написано" })
        }
        const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email)
        if (!user) return res.status(401).json({ error: "ты накосячил гдетол" })
        const hashed = bcr.compareSync(password, user.password)
        if (!hashed) return res.status(401).json({ error: "не правильго" })
        const { password: _, ...safeUser } = user
        const token = jwt.sign(safeUser, SECRET, { expiresIn: "24h" })
        return res.status(200).json({ success: true, token, error: null })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }

})
app.get("/api/auth/profile", auth, (req, res) => {

    try {
        const user = db.prepare("SELECT * FROM User WHERE id = ?").get(req.user.id)
        if (!user) return res.status(401).json({ error: "ты накосячил гдето" })
        const { password: _, ...safeUser } = user
        return res.status(200).json({ success: true, safeUser, error: null })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.get("/api/books", auth, (req, res) => {

    try {
        const books = db.prepare("SELECT * FROM Book").all()
        if (!books) return res.status(401).json({ error: "ты накосячил гдето" })
        
        return res.status(200).json({ success: true, books, error: null })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.post("/api/books", auth, (req, res)=>{
    try {
        const book = db.prepare("INSERT INTO Books VALUES(?,?,?) ")
    } catch (error) {
        
    }
})
app.listen(3001)