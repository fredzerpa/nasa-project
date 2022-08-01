const {
  abortLaunchById,
  scheduleNewLaunch,
  existsLaunchWithId,
  getAllLaunches,
} = require('../../../../models/launches/launches.model');
const { getPagination } = require('../../../../services/query');

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit);
  return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
  const launch = req.body;

  if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target)
    return res.status(400).json({
      error: 'Missing required launch property',
    });

  launch.launchDate = new Date(launch.launchDate);

  if (isNaN(launch.launchDate.valueOf()))
    return res.status(400).json({
      error: 'Invalid launch date',
    });

  await scheduleNewLaunch(launch);

  return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
  const launchId = Number(req.params.id);
  const existsLaunch = await existsLaunchWithId(launchId);

  if (!existsLaunch)
    // if launch doesn't exists
    return res.status(404).json({
      error: 'Launch not found',
    });

  const isAborted = await abortLaunchById(launchId);

  // Error aborting the launch
  if (!isAborted) {
    return res.status(500).json({
      error: `Error when attempting to abort Launch: ${launchId}.`,
    });
  }

  // Everything went s moothly.
  return res.status(200).json({
    ok: true,
  });
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
};
