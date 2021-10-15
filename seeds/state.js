const tableNames = require('../src/constants/tablenames');
const PresenceStates = require('../src/constants/PresenceStatus');
/**
 * @param {Knex} knex
 */
exports.seed = async (knex) => {
  const data = await knex(tableNames.state).select('id');
  if (data[0].id != 1) {
    console.log('deleting data');
    await knex(tableNames.state).del();
    console.log('creating data');
    const stateData = [];
    for (const state in PresenceStates) {
      stateData.push(PresenceStates[state]);
    }
    await knex(tableNames.state).insert(stateData);
  }
};
