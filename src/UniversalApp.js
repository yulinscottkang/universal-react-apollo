import { ApolloServer } from "apollo-server-express";

import createServerRender from "./createServerRender";
import { LIB_TAG } from "./config/constants";

const initServer = function(app, routes, apolloServerOptions, production) {
  // mount apollo-server-express middleware
  const apolloServer = new ApolloServer({
    ...apolloServerOptions,
    uploads: false,
    playground: !production
  });
  apolloServer.applyMiddleware({ app });

  const {
    typeDefs,
    resolvers,
    dataSources,
    context,
    schemaDirectives
  } = apolloServerOptions;

  // create server render
  const serverRender = createServerRender({
    typeDefs,
    resolvers,
    schemaDirectives
  });

  // mount application routing
  if (Array.isArray(routes)) {
    routes.forEach(
      ({
        path,
        method = "get",
        appElement,
        headElement,
        bodyBottomElement,
        middlewareChain = []
      }) => {
        app[method.toLowerCase()](path, middlewareChain, (req, res, next) => {
          serverRender({
            appElement,
            headElement,
            bodyBottomElement,
            req,
            cache: apolloServer.requestOptions.cache,
            dataSources:
              typeof dataSources === "function" ? dataSources() : null,
            context:
              typeof context === "function"
                ? context({ req, connection: {}, res })
                : context
          })
            .then(html => {
              res.status(200);
              res.send(html);
              res.end();
            })
            .catch(error => {
              next(error);
            });
        });
      }
    );
  } else {
    console.error(
      `[${LIB_TAG}] Required argument - routes is not present or not an array`
    );
  }
};

export default initServer;
