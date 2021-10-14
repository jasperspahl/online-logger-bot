const tableNames = require('../src/constants/tablenames');
const PresenceStates = require('../src/constants/PresenceStatus');
/**
 * @param {Knex} knex
 */
exports.seed = async (knex) => {
  // Deletes ALL existing entries
  await knex(tableNames.state).del();
  // Inserts seed entries
  const stateData = [];
  for (const state in PresenceStates) {
    stateData.push(PresenceStates[state]);
  }
  await knex(tableNames.state).insert(stateData);
};