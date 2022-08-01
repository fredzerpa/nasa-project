const axios = require('axios');

const launchesDatabase = require('./launches.mongo');
const planets = require('../planets/planets.mongo');

const SPACEX_API_URL_LAUNCHES = `https://api.spacexdata.com/v4/launches`;

async function populateLaunches() {
  console.log('Downloading Launches data...');

  try {
    const response = await axios.post(`${SPACEX_API_URL_LAUNCHES}/query`, {
      query: {},
      options: {
        pagination: false,
        populate: [
          {
            path: 'rocket',
            select: {
              name: 1,
            },
          },
          {
            path: 'payloads',
            select: {
              customers: 1,
            },
          },
        ],
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Launch data download failed. Status code: ${response.status}`
      );
    }

    const launchesCollection = response.data.docs;

    for (const launchDoc of launchesCollection) {
      // Merge all customers into one array
      const customers = launchDoc['payloads'].flatMap(
        payload => payload['customers']
      );

      const launch = {
        flightNumber: launchDoc['flight_number'],
        mission: launchDoc['name'],
        rocket: launchDoc['rocket']['name'],
        launchDate: launchDoc['date_local'],
        upcoming: launchDoc['upcoming'],
        success: launchDoc['success'],
        customers,
      };

      console.log(`${launch.flightNumber} ${launch.mission}`);

      await saveLaunch(launch);
    }
  } catch (error) {
    throw new Error(`Failure loading Spacex Launches data. ${error}`);
  }
}

async function loadLaunchesData() {
  const dbLaunches = await getAllLaunches();
  const spacexLatestLaunch = await getSpacexLatestLaunch();
  const dbIsUpToDate = !!dbLaunches.find(
    dbLaunch => dbLaunch.flightNumber === spacexLatestLaunch.flight_number
  );

  // Sync with Spacex Launches data
  if (dbIsUpToDate) {
    console.log('Launch data already loaded!');
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

async function getLatestLaunch() {
  const latestLaunch = await launchesDatabase
    .findOne()
    .sort({ flightNumber: 'desc' });

  return latestLaunch;
}

async function getSpacexLatestLaunch() {
  try {
    const response = await axios.post(`${SPACEX_API_URL_LAUNCHES}/query`, {
      query: {},
      options: {
        sort: '-flight_number',
        limit: 1,
      },
    });

    // Select the first Document
    const latestSpacexLaunch = response.data.docs[0];
    return latestSpacexLaunch;
  } catch (error) {
    throw new Error(`Couldn't fetch SPACEX Latest Launch. ${error}`);
  }
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find(
      {},
      {
        _id: 0,
        __v: 0,
      }
    )
    .sort({
      flightNumber: 'desc',
    })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({ keplerName: launch.target });
  if (!planet)
    throw new Error(`No matching planet was found by name "${launch.target}"`);

  // If there's no launch then start at default
  const DEFAULT_LAUNCH = { flightNumber: 0 };
  const latestLaunch = (await getLatestLaunch()) ?? DEFAULT_LAUNCH;

  const newFlightNumber = latestLaunch.flightNumber + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ['ZTM', 'NASA'],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.acknowledged;
}

module.exports = {
  loadLaunchesData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
