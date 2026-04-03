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
        const user = db.prepare("SELECT * FROM User WHERE id = ?").get(res.id)
        if (!user) return res.status(401).json({ error: "ты накосячил гдето" })
        const { password: _, ...safeUser } = user
        return res.status(200).json({ success: true, safeUser, error: null })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.get("/api/books", (req, res) => {

    try {
        const books = db.prepare("SELECT * FROM Book").all()
        if (!books) return res.status(401).json({ error: "ты накосячил гдето" })

        return res.status(200).json({ success: true, books, error: null })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.get("/api/books/:id", (req, res) => {
    try {
        const book = db.prepare("SELECT * FROM Book WHERE id = ?").get(req.params.id)
        res.status(200).json(book)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.post("/api/books", auth, (req, res) => {
    try {
        const { title, author, year, genre, description } = req.body;
        const userId = req.user.id;
        const query = db.prepare(`INSERT INTO Book (title, author, year,genre,description,createdBy) VALUES (?, ?, ?, ?, ?, ?)`).run(title, author, year, genre, description, userId);
        const newBook = db.prepare("SELECT * FROM Book WHERE id  = ?").get(query.lastInsertRowid)
        res.status(201).json(newBook)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.delete("/api/books/:id", auth, (req, res) => {
    try {
        const bookId = req.params.id;
        const deleteook = db.prepare("DELETE FROM Book WHERE id = ?").run(bookId);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.put("/api/books/:id", auth, (req, res) => {
    try {
        const { title, author, year, genre, description } = req.body;
        const bookId = req.params.id;
        const userId = req.user.id;
        const query = db.prepare(`UPDATE Book
      SET title = ?, author = ?, year = ?, genre = ?, description = ?, createdBy = ?
      WHERE id = ?`).run(title, author, year, genre, description, userId, bookId);
        const updatedBook = db
            .prepare("SELECT * FROM Book WHERE id = ?")
            .get(bookId);
        res.status(200).json(updatedBook);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.post("/api/books/:id/reviews", auth, (req, res) => {
    try {
        const { rating, comment } = req.body
        const userid = req.user.id;
        const bookid = req.params.id;
        const query = db.prepare(`INSERT INTO Review (bookId,userId,rating,comment) VALUES(?,?,?,?)`).run(bookid, userid, rating, comment);
        const newReviw = db.prepare(`SELECT * FROM Review WHERE bookid = ?`).get(query.lastInsertRowid);
        res.status(201).json(newReviw);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "something went wrong" })

    }
})
app.get("/api/books/:id/reviews", (req, res) => {
    try {
        const book = db.prepare("SELECT * FROM Review WHERE bookId = ?").get(req.params.id)
        res.status(200).json(book)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.delete("/api/reviews/:id", auth, (req, res) => {
    try {
        const reviewId = req.params.id;
        const deleteook = db.prepare("DELETE FROM Review WHERE id = ?").run(reviewId);
        res.status(200).json({ success: true }, deleteook);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.get("/api/admin/users", auth, (req, res) => {
    const admin = req.user.role
    try {
        if (admin === "admin") {
            const query = db.prepare("SELECT * FROM User").all()
            res.status(200).json(query);
        } else {
            res.status(403).json({ error: "Ты не админ" })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.delete("/api/admin/users/:id", auth, (req, res) => {
    const admin = req.user.role
    const userid = req.params.id
    try {
        if (admin !== "admin") {
            res.status(401).json({ error: "Ты не админ" })
        }
        const query = db.prepare("DELETE FROM User WHERE id = ?").run(userid)
        res.status(202).json({success: "true"});
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }
})
app.listen(3001)