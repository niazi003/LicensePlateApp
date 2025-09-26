import React, {useEffect} from 'react';
import {View, Text} from 'react-native';

const GOOGLE_API_KEY = "AIzaSyBYAcaLnZ1q2eCN3jSHzzvRUlYxNYSdXQQ"; // replace with your key

export default function SightingsDetail() {
  const [result, setResult] = React.useState("");

  useEffect(() => {
    async function testAPI() {
      const lat = 37.4219983; // sample: Google HQ
      const lng = -122.084;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("API Response:", data);

        if (data.status === "OK") {
          setResult(data.results[0].formatted_address);
        } else {
          setResult("Error: " + data.status);
        }
      } catch (err) {
        console.error(err);
        setResult("Request failed");
      }
    }

    testAPI();
  }, []);

  return (
    <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
      <Text style={{padding: 20, textAlign: "center"}}>
        {result ? result : "Testing API key..."}
      </Text>
    </View>
  );
}
