// helper to convert a function returning res.json into data
export const callInsightFunction = async (func, req) => {
  // create a fake `res` object to capture json response
  let data;
  const fakeRes = {
    status: () => ({
      json: (d) => {
        data = d;
      },
    }),
  };
  await func(req, fakeRes);
  return data;
};