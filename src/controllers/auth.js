const jsonWebToken = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')

const response = require('../utils/response')
const { isExists, isFilled } = require('../utils/validator')
const userModel = require('../models/user')

require('dotenv').config()
const { SECRET_KEY } = process.env

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body

    if (!isFilled({ email, password })) return res.status(400).send(response(false, req.body, 'Email and password must be filled'))

    const userExists = await isExists({ email }, 'users')
    if (!userExists) return res.status(404).send(response(false, req.body, 'Email is not found'))

    if (bcryptjs.compareSync(password, userExists.password)) {
      const bioExists = await isExists({ user_id: userExists.id }, 'user_details')
      const jwt2 = jsonWebToken.sign({ user: { ...userExists, ...{ bio: bioExists || null } } }, SECRET_KEY)
      return res.status(200).send(response(true, {
        token: jwt2
      }, 'Login success'))
    } else {
      return res.status(403).send(response(false, req.body, 'Password didn\'t match'))
    }
  },
  register: async (req, res) => {
    const { email, password } = req.body

    if (!isFilled({ email, password })) return res.status(400).send(response(false, req.body, 'Email and password must be filled'))

    const userExists = await isExists({ email }, 'users')
    if (userExists) return res.status(400).send(response(false, req.body, 'Email is already used'))

    if (userModel.create({ email, password: bcryptjs.hashSync(password), role_id: 2 })) {
      return res.status(201).send(response(true, req.body, 'User successfully created'))
    } else {
      return res.status(500).send(response(false, req.body, 'Unhandled error or internal server error'))
    }
  },
  completeRegistration: async (req, res) => {
    const { name, birthdate, phone, gender } = req.body
    const userId = req.me.id

    const data = { ...req.body, ...{ user_id: userId } }

    if (!isFilled({ name, birthdate, phone, gender })) return res.status(400).send(response(false, data, 'Name, birthdate, phone, and gender must be filled'))

    const userExists = await isExists({ user_id: userId }, 'user_details')
    if (userExists) return res.status(400).send(response(false, data, 'User is already complete biodata'))

    if (userModel.complete_biodata({ name, birthdate, phone, gender, user_id: userId })) {
      return res.status(201).send(response(true, data, 'Biodata successfully created'))
    } else {
      return res.status(500).send(response(false, data, 'Unhandled error or internal server error'))
    }
  }
}
