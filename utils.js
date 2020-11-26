const cliProgress = require('cli-progress');

const chunk = (arr, size) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))
}

module.exports = {
  batch: async (operations, max, message) => {
    const bar = new cliProgress.SingleBar({
      noTTYOutput: true,
      format: `${message} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
    }, cliProgress.Presets.shades_classic);

    if (operations.length <= max) {
      // Generate the array for promise.all
      const promiseArr = operations.map(toExecute => (
        toExecute.func.apply(null, toExecute.params)
      ));

      return await Promise.all(promiseArr);
    }

    bar.start(operations.length, 0);

    const toDo = chunk(operations, max);

    let results = [];
    let error = false;
    let index = 0;

    while (results.length !== toDo.length) {
      try {
        if (index === results.length) {
          // Generate the array for promise.all
          const promiseArr = toDo[index].map(toExecute => (
            toExecute.func.apply(null, toExecute.params)
          ));

          // Execute in parallel
          const res = await Promise.all(promiseArr);

          // Append result
          results.push(res);
          index = index + 1;
          bar.increment(res.length);
        }
      } catch (e) {
        // Scape While
        error = e;
        break;
      }
    }

    bar.stop();

    if (error) {
      console.log(error)
      throw new Error('Hubo un error corriendo el batch');
    }

    return [].concat.apply([], results);
  }
};
