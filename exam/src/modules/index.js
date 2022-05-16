import { makeExecutableSchema } from '@graphql-tools/schema'

import TypeModule from './types/index.js'
import StaffModule from './staff/index.js'
import BranchModule from './branch/index.js'

export default makeExecutableSchema({
    typeDefs: [
        StaffModule.typeDefs,
        TypeModule.typeDefs,
        BranchModule.typeDefs,
    ],
    resolvers: [
        StaffModule.resolvers,
        TypeModule.resolvers,
        BranchModule.resolvers,
    ],
})