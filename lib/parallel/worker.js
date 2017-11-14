const ResolverFactory = require("enhanced-resolve").ResolverFactory;
const NodeJsInputFileSystem = require("enhanced-resolve/lib/NodeJsInputFileSystem");
const CachedInputFileSystem = require("enhanced-resolve/lib/CachedInputFileSystem");

// This is technically a memory leak, but it didn't result in a perf gain, so
// it doesn't really matter.
const resolverMap = new Map();

// TODO - handle different inputfilesystems for feature parity.
module.exports = function(input, callback) {
  const context = input.context;
  const path = input.path;
  const request = input.request;
  const resolverOptions = input.resolverOptions;

  const stringifiedOptions = JSON.stringify(input.resolverOptions);

  if(!resolverMap[stringifiedOptions]) {
    resolverMap[stringifiedOptions] = ResolverFactory.createResolver(Object.assign(resolverOptions, {
      // These are the defaults unless you override in your webpack config.
      fileSystem: new CachedInputFileSystem(new NodeJsInputFileSystem(), 60000)
    }));
  }
  const resolver = resolverMap[stringifiedOptions];

  return resolver.resolve(context, path, request, callback);
};
