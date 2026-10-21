import next from 'eslint-config-next'

const config = [...next, { ignores: ['.next/**', 'src/db/migrations/**'] }]

export default config
