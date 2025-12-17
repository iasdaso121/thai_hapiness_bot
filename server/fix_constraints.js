require('dotenv').config();
const sequelize = require('./db');

async function fixConstraints() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Find the unique constraint on the 'positions' table
        const [results, metadata] = await sequelize.query(`
            SELECT conname
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' 
            AND conrelid = 'positions'::regclass
            AND contype = 'u';
        `);

        console.log('Unique constraints on "positions" table:', results);

        if (results.length > 0) {
            for (const constraint of results) {
                const constraintName = constraint.conname;
                console.log(`Dropping constraint: ${constraintName}`);
                await sequelize.query(`ALTER TABLE positions DROP CONSTRAINT "${constraintName}";`);
                console.log(`Constraint ${constraintName} dropped successfully.`);
            }
        } else {
            console.log('No unique constraints found on "positions" table.');
        }

    } catch (error) {
        console.error('Unable to connect to the database or execute query:', error);
    } finally {
        await sequelize.close();
    }
}

fixConstraints();
