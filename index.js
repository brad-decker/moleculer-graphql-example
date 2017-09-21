const express = require('express');
const graphqlHTTP = require('express-graphql');
const requireText = require('require-text');
const { makeExecutableSchema } = require('graphql-tools');
const { ServiceBroker } = require('moleculer');

const players = require('./players');
const items = require('./items');

const broker = new ServiceBroker({ logger: console });

broker.createService({
  name: 'player',
  actions: {
    get: {
      params: {
        id: { type: 'number' }
      },
      handler: ctx => players[ctx.params.id],
    },
    getAll: () => Object.values(players),
  },
});

broker.createService({
  name: 'item',
  actions: {
    get: {
      params: {
        id: { type: 'number' }
      },
      handler: ctx => items[ctx.params.id],
    },
    getAll: () => Object.values(items),
  },
});

broker.start();

const typeDefs = requireText('./schema.graphql', require);

const resolvers = {
  Query: {
    players: () => broker.call('player.getAll'),
    player: (root, { id }) => broker.call('player.get', { id }),
    items: () => broker.call('item.getAll'),
    item: (root, { id }) => broker.call('item.get', { id }),
  },
  Player: {
    items({ items }) {
      return broker.mcall(items.map((item) => ({
        action: 'item.get',
        params: { id: item },
      })));
    }
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: resolvers,
  graphiql: true,
}));

app.listen(5000);
