import model from "./model.js"
import { UserInputError } from 'apollo-server-express'
import { STAFF_CONFIG } from '#config/index'
import JWT from "../../utils/jwt.js"
import sha256 from "sha256"

export default {
    Query: {
        staffs: async(_, args, req) => {
            const {token} = req.headers
            const ipp = req.headers['x-forwarded-for'] || req.socket.remoteAddress
            const agentt = req.headers['user-agent']
            if(!token) {
                throw new UserInputError("User is un authorizate!")
            }

            const {ip, agent, staffId, branchname, isRoot } = JWT.verify(token)
            if(!(ipp === ip) || !(agent === agentt)) {
                throw new UserInputError("Token is invalid!")
            }

            let res = await model.staffPer({
                staffId,
                branchname
            })
            console.log(res);

            let checkk = await model.getStaff({staffId})
            if (checkk.staff_is_root) {
                let staff = await model
                .getStaffs({
                    page: args.page ? args.page : STAFF_CONFIG.PAGINATION.PAGE,
                    limit: args.limit ? args.limit : STAFF_CONFIG.PAGINATION.LIMIT,
                    search: args.search
                })
                
                return staff
            }

            if(res.staff_read){
                return await model.resStaffPer({
                    page: args.page ? args.page : STAFF_CONFIG.PAGINATION.PAGE,
                    limit: args.limit ? args.limit : STAFF_CONFIG.PAGINATION.LIMIT,
                    search: args.search,
                    branchname
                })
            }else{
                let res = await model.getStaff({staffId})
                console.log(res);
                return res
            }
        },
        staff: async(_, args) => {
            return await model.getStaff(args)
        }
    },

    Mutation: {
        register: async(_, args, req) => {
            let { staffname, password, repeatPassword, staffWorkPlace, staffBirthDate } = args
            const staffs = await model.getStaffs({
                page: args.page ? args.page : STAFF_CONFIG.PAGINATION.PAGE,
                limit: args.limit ? args.limit : STAFF_CONFIG.PAGINATION.LIMIT,
                search: args.search
            })

            staffname = staffname.trim()
            password = password.trim()
            repeatPassword = repeatPassword.trim()
            if(
                !staffname ||
                staffname.length > 50
            ) {
                throw new UserInputError("The username cannot be empty!")
            }

            if((
                !password || password.length < 6 ||
                password.length > 50) || 
                (
                    !repeatPassword || repeatPassword.length < 6 ||
                    repeatPassword.length > 50
                ) || password !== repeatPassword
            ) {
                throw new UserInputError("Invalid password!")
            }

            if(staffs.find(user => user.staffname == staffname)) {
                throw new UserInputError("The user Already exists!")
            }

            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
            const agent = req.headers['user-agent']

            let insert = await model.addStaff({
                staffname,
                password: sha256(password),
                staffWorkPlace,
                staffBirthDate
            })

            console.log(insert.staff_id);

            return {
                    status: 200,
                    message: 'The user successfully registered!',
                    token: JWT.sign({ agent, ip, staffId: insert.staff_id, branchName: insert.branch_name, isRoot: insert.staff_is_root, branche }),
                    data: insert
                }

        },

        login: async(_, args, req) => {
            console.log(req.headers);
            let { staffname, password } = args
            const staffs = await model.getStaffs({ 
                page: args.page ? args.page : STAFF_CONFIG.PAGINATION.PAGE,
                limit: args.limit ? args.limit : STAFF_CONFIG.PAGINATION.LIMIT,
                search: args.search
            })
            staffname = staffname.trim()
            password = password.trim()

            let check = await model.staffLogin({
                staffname,
                password: sha256(password)
            })
            console.log(check);

            if (!check) {
                throw new UserInputError("Invalid username or password!")
            }

            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
            const agent = req.headers['user-agent']


            return {
                status: 200,
                message: 'The user successfully logged in!',
                token: JWT.sign({ agent, ip, staffId: check.staff_id, branchName: check.branch_name, isRoot: check.staff_is_root, branchId: check.branch_id }),
                data: check
            }
            
        }
    },

    Staff: {
        staffId: global => global.staff_id,
        staffname: global => global.staff_name,
        staffBirthDate: global => global.staff_birth_date,
        staffWorkPlace: global => global.branch_name || global.branch_id,
        fullAdress: global => global.full_adress,
        staffCreatedAt: global => global.staff_created_at,
        staffIsRoot: global => global.staff_is_root
    }
}