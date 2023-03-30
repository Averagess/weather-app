import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import LabeledText from "@/components/LabeledText";
import getCurrentISOTime from "@/lib/getCurrentISOTime";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  if (!context.params?.city) return { notFound: true };
  const city = context.params.city;

  const coordRes = await axios.get(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
  );
  if (
    coordRes.data.results === undefined ||
    coordRes.data?.results?.length === 0
  )
    return { notFound: true };

  const lat = coordRes.data?.results[0]?.latitude;
  const lng = coordRes.data?.results[0]?.longitude;
  const cityName = coordRes.data?.results[0]?.name;
  const stateName = coordRes.data?.results[0]?.admin1;
  const countryName = coordRes.data?.results[0]?.country;

  const weatherRes = await axios.get(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,cloudcover,visibility,windspeed_10m,winddirection_10m,apparent_temperature,precipitation_probability,precipitation`
  );
  const weather = weatherRes.data;
  if (!weather) return { notFound: true };

  return {
    props: {
      weather: JSON.stringify(weather),
      city: cityName,
      state: stateName,
      country: countryName,
    }, // will be passed to the page component as props
  };
}

interface Props {
  weather: any;
  city: string;
  state: string;
  country: string;
}

const WeatherPage = ({ weather, city, state, country }: Props) => {
  const [parsedWeather, setParsedWeather] = useState<any>(null);
  console.log("weather data:", parsedWeather);

  useEffect(() => {
    const parsedWeather = JSON.parse(weather);
    setParsedWeather(parsedWeather);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tempUnit = parsedWeather?.hourly_units?.temperature_2m ?? "°C";
  const cloudcoverageUnit = parsedWeather?.hourly_units?.cloudcover ?? "%";
  const windspeedUnit = parsedWeather?.hourly_units?.windspeed_10m ?? "m/s";
  const winddirectionUnit =
    parsedWeather?.hourly_units?.winddirection_10m ?? "°";
  const precipitationUnit = parsedWeather?.hourly_units?.precipitation ?? "mm";
  const precipitationProbabilityUnit =
    parsedWeather?.hourly_units?.precipitation_probability ?? "%";

  if (parsedWeather === null) return <div>Loading...</div>;

  const currentTime = getCurrentISOTime();
  const currentlyIndex = parsedWeather.hourly.time.indexOf(currentTime);

  const currentTemp = parsedWeather.hourly.temperature_2m[currentlyIndex];
  const currentCloudcoverage = parsedWeather.hourly.cloudcover[currentlyIndex];
  const currentVisibility = parsedWeather.hourly.visibility[currentlyIndex];
  const currentWindspeed = parsedWeather.hourly.windspeed_10m[currentlyIndex];
  const currentWinddirection =
    parsedWeather.hourly.winddirection_10m[currentlyIndex];
  const currentApparentTemp =
    parsedWeather.hourly.apparent_temperature[currentlyIndex];

  const visibilityFormatted =
    currentVisibility > 1000
      ? (currentVisibility / 1000).toFixed(1) + "km"
      : currentVisibility + "m";

  const pairedData = parsedWeather.hourly.temperature_2m.map(
    (temp: number, i: number) => {
      const time = new Date(parsedWeather.hourly.time[i]).toLocaleTimeString(
        [],
        { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      );
      return {
        time,
        temp,
        cloudCover: parsedWeather.hourly.cloudcover[i],
        precipitation: parsedWeather.hourly.precipitation[i],
        precipitationProbability:
          parsedWeather.hourly.precipitation_probability[i],
      };
    }
  );

  console.log(pairedData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl  bg-gray-600 bg-opacity-50 p-2 font-semibold text-white">
          <p className="label">{label}</p>
          {payload.map((data: any, index: number) => (
            <p key={index}>{`${data.value} ${data.unit}`}</p>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <main
      className="
      flex h-screen w-screen flex-col 
      items-center justify-center"
    >
      <div className="container h-fit rounded-lg bg-gradient-to-br from-blue-400 to-blue-800 p-8">
        <div className="flex content-center justify-between">
          <div>
            <h2
              title={`${parsedWeather.latitude}, ${parsedWeather.longitude}`}
              className="text-2xl font-semibold text-white"
            >
              {city}
            </h2>
            <p className="font-semibold text-gray-300">{`${state}, ${country}`}</p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            <LabeledText label="Currently" text={currentTemp + tempUnit} />
            <LabeledText
              label="Feels like"
              text={currentApparentTemp + tempUnit}
            />
            <LabeledText label="Visibility" text={visibilityFormatted} />
            <LabeledText
              label="Cloud coverage"
              text={currentCloudcoverage + cloudcoverageUnit}
            />
            <LabeledText
              label="Wind speed"
              text={currentWindspeed + windspeedUnit}
            />
            <LabeledText
              label="Wind direction"
              text={currentWinddirection + winddirectionUnit}
            />
          </div>
        </div>
        <div className="flex h-full flex-col">
          <h1 className="text-4xl text-white underline">Weekly forecasts</h1>
          <div className="ml-6 grid grid-cols-1 grid-rows-2 font-semibold text-white lg:grid-cols-2">
            <div>
              <h1 className="text-2xl">Temperature</h1>
              <LineChart width={500} height={200} data={pairedData}>
                <CartesianGrid strokeDasharray="8 3" />
                <XAxis
                  stroke="#FFFFFF"
                  dataKey="time"
                  minTickGap={10}
                  tickFormatter={(value: string) => value.substring(0, 5)}
                />
                <YAxis stroke="#FFFFFF" unit={tempUnit} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  dot={false}
                  type="monotone"
                  dataKey="temp"
                  stroke="#FFFFFF"
                  unit={tempUnit}
                />
              </LineChart>
            </div>
            <div>
              <h1 className="text-2xl">Cloud coverage</h1>
              <LineChart width={500} height={200} data={pairedData}>
                <CartesianGrid strokeDasharray="8 3" />
                <XAxis
                  stroke="#FFFFFF"
                  dataKey="time"
                  minTickGap={10}
                  tickFormatter={(value: string) => value.substring(0, 5)}
                />
                <YAxis stroke="#FFFFFF" unit={cloudcoverageUnit} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  dot={false}
                  type="monotone"
                  dataKey="cloudCover"
                  stroke="#FFFFFF"
                  unit={cloudcoverageUnit}
                />
              </LineChart>
            </div>
            <div>
              <h1 className="text-2xl">Precipitation</h1>
              <ComposedChart width={500} height={200} data={pairedData}>
                <CartesianGrid strokeDasharray="8 3" />
                <XAxis
                  stroke="#FFFFFF"
                  dataKey="time"
                  minTickGap={10}
                  tickFormatter={(value: string) => value.substring(0, 5)}
                />
                <YAxis stroke="#FFFFFF" unit={precipitationProbabilityUnit} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  dot={false}
                  type="monotone"
                  dataKey="precipitationProbability"
                  stroke="#FFFFFF"
                  unit={precipitationProbabilityUnit}
                />
                <Bar
                  type="monotone"
                  dataKey="precipitation"
                  unit={precipitationUnit}
                  fill="#003FFB"
                  barSize={25}
                  // barSize={25}
                  // minPointSize={25}
                />
              </ComposedChart>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default WeatherPage;
