const ResolverFactory = require("enhanced-resolve").ResolverFactory;
const workerFarm = require("worker-farm");
const os = require("os");

const farmCompilers = new Set();

let farm;
let _resolve;

function createManager(compiler) {
  return {
    endFarm: function endFarm() {
      farmCompilers.delete(compiler);
      if(farmCompilers.size === 0) {
        workerFarm.end(farm);
      }
    },
    resolve: function resolve() {
      return _resolve.apply(null, arguments);
    }
  };
}

module.exports = {
  startFarm: function startFarm(compiler) {
    farmCompilers.add(compiler);
    if(!farm) {
      farm = workerFarm({
          autoStart: true,
          maxConcurrentCallsPerWorker: Infinity,
          maxConcurrentWorkers: os.cpus().length - 1,
          maxRetries: 2, // Allow for a couple of transient errors.
        },
        require.resolve("./worker")
      );
      // _resolve = pify(farm);
    }

    return createManager(compiler);
  },
  createResolverWith(resolverOptions) {
    const resolver = ResolverFactory.createResolver(resolverOptions);
    // const originalResolve = resolver.resolve;
    resolver.resolve = function(context, path, request, callback) {
      // return originalResolve.apply(this, arguments);
      resolverOptions.fileSystem = undefined;
      // console.log(context, path, request);
      return farm({
        context,
        path,
        request,
        resolverOptions,
      }, function(err, result) {
        callback(err, result);
      });
    };

    return resolver;
  }
};
