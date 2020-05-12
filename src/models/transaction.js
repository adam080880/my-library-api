const con = require('../utils/db')

const table = 'transactions'

module.exports = {
  get: (start, end) => {
    const sql = `SELECT t.id, t.promise_returned_at, books.title as book_title, (SELECT users.email FROM users WHERE users.id=t.admin_id) as admin, (SELECT users.email FROM users WHERE users.id=t.member_id) as member, transaction_statuses.name as status FROM ${table} t, books, transaction_statuses WHERE transaction_statuses.id=t.transaction_status_id AND books.id=t.book_id LIMIT ${end} OFFSET ${start}`
    return new Promise((resolve, reject) => {
      con.query(sql, (err, res) => {
        if (err) reject(Error(err))
        if (res.length > 0) resolve(res)
        else resolve(false)
      })
    })
  },
  count: () => {
    return new Promise((resolve, reject) => {
      con.query(`SELECT COUNT(*) as total FROM ${table}`, (err, res) => {
        if (err) reject(Error(err))
        resolve(res[0].total)
      })
    })
  },
  getOne: (data) => {
    const sql = `SELECT * FROM ${table} WHERE ?`
    return new Promise((resolve, reject) => {
      con.query(sql, data, (err, res) => {
        if (err) reject(Error(err))

        if (res.length > 0) resolve(res[0])
        else resolve(false)
      })
    })
  },
  toBorrow: (_data) => {
    const sql = `UPDATE ${table} SET ? WHERE ?`
    const data = [{ transaction_status_id: 2, ..._data[0] }, { ..._data[1] }]
    return new Promise((resolve, reject) => {
      con.query(sql, data, (err, res) => {
        if (err) reject(Error(err))
        resolve(true)
      })
    })
  },
  toReturn: (_data, data2) => {
    const sql = `UPDATE ${table} SET ? WHERE ?`
    const sql2 = 'UPDATE books SET book_status_id=1 WHERE ?'

    const data = [{ transaction_status_id: 3, ..._data[0] }, { ..._data[1] }]
    return new Promise((resolve, reject) => {
      con.beginTransaction(() => {
        con.query(sql, data, (err, res) => {
          if (err) {
            con.rollback((rollbackErr) => {
              if (rollbackErr) reject(Error(rollbackErr).message)
              else reject(err.message)
            })
          }
        })
        con.query(sql2, data2, (err, res) => {
          if (err) {
            con.rollback((rollbackErr) => {
              if (rollbackErr) reject(Error(rollbackErr).message)
              else reject(err.message)
            })
          }
          con.commit((commitError) => {
            if (commitError) reject(Error(commitError).message)
            resolve(true)
          })
        })
      })
    })
  }
}
