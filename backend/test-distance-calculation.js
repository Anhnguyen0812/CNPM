// test-distance-calculation.js
// File này test các hàm tính toán khoảng cách và thời gian di chuyển

const rideMatchingService = require('./services/ride-matching.service');

/**
 * Script này kiểm tra tính chính xác của các hàm tính toán địa lý cơ bản
 * như tính khoảng cách giữa hai điểm, ước tính thời gian di chuyển
 */
async function testDistanceCalculations() {
  try {
    console.log("=== TESTING DISTANCE & TIME CALCULATIONS ===");
    
    // Hàm calculateHaversineDistance không được export, vì vậy chúng ta sẽ test 
    // hàm đó gián tiếp thông qua các hàm đã được export
    
    // Định nghĩa một số điểm tham chiếu ở Hà Nội để test
    const locations = {
      boCA: [21.0445, 105.7828], // Bộ Công An [lat, lon]
      dhqg: [21.0372, 105.7822], // Đại học Quốc gia
      mobifone: [21.0305, 105.7823], // Mobifone
      keangnam: [21.0179, 105.7838], // Tòa nhà Keangnam
      timescity: [20.9953, 105.8658], // Times City
      westlake: [21.0586, 105.8095], // Hồ Tây
      nhatanco: [21.0249, 105.8184], // Nhà hát lớn
    };
    
    // Test 1: Tính khoảng cách qua test case đặc biệt
    // Gọi hàm sử dụng khoảng cách Haversine
    const testCoordinates = [
      [locations.boCA[1], locations.boCA[0]], // [lon, lat] - format sử dụng trong hệ thống
      [locations.dhqg[1], locations.dhqg[0]],
      [locations.mobifone[1], locations.mobifone[0]],
      [locations.westlake[1], locations.westlake[0]],
    ];
    
    // Tạo GeoJSON route qua các điểm trên để test
    console.log("\n=== Test 1: Generate GeoJSON Route & Extract Distances ===");
    try {
      const geoJsonRoute = await rideMatchingService.generateGeoJSONRoute(testCoordinates);
      console.log("Route generated successfully:");
      console.log(`- Total Distance: ${geoJsonRoute.properties.distance} meters`);
      console.log(`- Total Duration: ${geoJsonRoute.properties.duration} seconds`);
      console.log(`- Waypoints: ${geoJsonRoute.geometry.coordinates.length}`);
      
      // Tính trung bình thời gian di chuyển (giây/km)
      const avgTimePerKm = geoJsonRoute.properties.duration / (geoJsonRoute.properties.distance / 1000);
      console.log(`- Average Time per Kilometer: ${avgTimePerKm.toFixed(2)} seconds/km`);
      
    } catch (error) {
      console.log(`Error generating route: ${error.message}`);
      console.log("Skipping test case 1");
    }
    
    // Test 2: Tính ma trận khoảng cách để so sánh khoảng cách giữa các điểm
    console.log("\n=== Test 2: Calculate Distance Matrix ===");
    try {
      const origins = [
        [locations.boCA[1], locations.boCA[0]], // [lon, lat]
        [locations.dhqg[1], locations.dhqg[0]]
      ];
      
      const destinations = [
        [locations.mobifone[1], locations.mobifone[0]], 
        [locations.keangnam[1], locations.keangnam[0]]
      ];
      
      const distanceMatrix = await rideMatchingService.calculateMatrix(origins, destinations);
      
      console.log("Distance Matrix calculated successfully:");
      console.log("Durations (seconds):");
      console.log(distanceMatrix.durations);
      
      console.log("\nDistances (meters):");
      console.log(distanceMatrix.distances);
      
      // Phân tích kết quả
      console.log("\nMatrix Interpretation:");
      const locNames = ["Bộ Công An", "ĐHQG Hà Nội"];
      const destNames = ["Mobifone", "Keangnam"];
      
      for (let i = 0; i < origins.length; i++) {
        for (let j = 0; j < destinations.length; j++) {
          console.log(`- From ${locNames[i]} to ${destNames[j]}:`);
          console.log(`  • Distance: ${distanceMatrix.distances[i][j]} meters`);
          console.log(`  • Duration: ${distanceMatrix.durations[i][j]} seconds (${(distanceMatrix.durations[i][j] / 60).toFixed(2)} minutes)`);
        }
      }
      
    } catch (error) {
      console.log(`Error calculating matrix: ${error.message}`);
      console.log("Using manual calculations instead...");
      
      // Nếu API không hoạt động, chúng ta sẽ tính toán khoảng cách thủ công
      console.log("\nManual Haversine Distance Calculations:");
      
      // Sử dụng công thức Haversine
      function manualHaversineDistance(point1, point2) {
        const [lat1, lon1] = point1;
        const [lat2, lon2] = point2;
        
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c; // Distance in meters
      }
      
      // Tính khoảng cách giữa các địa điểm
      for (const [name1, coord1] of Object.entries(locations)) {
        for (const [name2, coord2] of Object.entries(locations)) {
          if (name1 !== name2) {
            const distance = manualHaversineDistance(coord1, coord2);
            const estimatedTime = (distance / 1000) / (30 / 3600); // Using 30 km/h average speed
            
            console.log(`- From ${name1} to ${name2}:`);
            console.log(`  • Distance: ${distance.toFixed(2)} meters`);
            console.log(`  • Estimated Time: ${estimatedTime.toFixed(2)} seconds (${(estimatedTime / 60).toFixed(2)} minutes)`);
          }
        }
      }
    }
    
    // Test 3: Tìm POI gần đó để kiểm tra khoảng cách
    console.log("\n=== Test 3: Find Nearby POIs ===");
    try {
      // Tìm siêu thị gần ĐHQG
      const [lat, lon] = locations.dhqg;
      const radius = 1000; // 1km
      
      console.log(`Searching for supermarkets within ${radius}m of ĐHQG Hà Nội [${lat}, ${lon}]...`);
      
      const pois = await rideMatchingService.findNearbyPOIs(lat, lon, radius, "supermarket");
      
      console.log(`Found ${pois.length} POIs`);
      
      if (pois.length > 0) {
        // Hiển thị top 5 POI
        const top5 = pois.slice(0, Math.min(5, pois.length));
        
        console.log("\nTop 5 nearest POIs:");
        top5.forEach((poi, idx) => {
          // Tính khoảng cách chính xác
          const poiCoord = poi.coordinates; // [lat, lon]
          // Sử dụng công thức Haversine
          function manualHaversineDistance(point1, point2) {
            const [lat1, lon1] = point1;
            const [lat2, lon2] = point2;
            
            const R = 6371e3; // Earth radius in meters
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;
            
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            return R * c; // Distance in meters
          }
          
          const distance = manualHaversineDistance(locations.dhqg, poiCoord);
          
          console.log(`${idx + 1}. ${poi.name}`);
          console.log(`   ID: ${poi.id}, Type: ${poi.type}`);
          console.log(`   Coordinates: [${poiCoord.join(', ')}]`);
          console.log(`   Distance: ${distance.toFixed(2)} meters`);
        });
      }
      
    } catch (error) {
      console.log(`Error finding POIs: ${error.message}`);
      console.log("POI search test skipped");
    }
    
    console.log("\n=== DISTANCE & TIME CALCULATIONS TEST COMPLETED ===");
    
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

// Chạy test
testDistanceCalculations();
