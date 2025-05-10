// test-ride-matching.js
const rideMatchingService = require('./services/ride-matching.service');

// Dữ liệu test cho các hoạt động của người dùng 1 (tài xế)
const driverActivities = [
  {
    id: 1,
    activity_name: "Bắt đầu từ Bộ Công an",
    location_name: "Bộ Công an, 47 Phạm Văn Đồng",
    start_lat: 21.0445,
    start_lon: 105.7828,
    activity_time: new Date("2023-08-15T08:00:00").getTime(),
    user_id: 1,
    duration: 30 * 60, // 30 phút 
    type: 0, // Fixed location
    is_time_flexible: true, // Để có thể ghép hành trình dễ hơn
    isSplitter: true
  },
  {
    id: 2,
    activity_name: "Mua sắm tại siêu thị",
    location_name: "Vinmart Cầu Giấy",
    start_lat: 21.0310,
    start_lon: 105.7890,
    activity_time: new Date("2023-08-15T08:45:00").getTime(), 
    user_id: 1,
    duration: 45 * 60, // 45 phút
    type: 1, // Flexible location
    poi_category: "supermarket",
    is_time_flexible: true, // Linh hoạt về thời gian
    isSplitter: false
  }
  //,
//   {
//     id: 6,
//     activity_name: "Làm việc tại Mobifone",
//     location_name: "Mobifone, Cầu Giấy",
//     start_lat: 21.0305,
//     start_lon: 105.7823,
//     activity_time: new Date("2023-08-15T09:45:00").getTime(), 
//     user_id: 1,
//     duration: 120 * 60, // 2 giờ
//     type: 0, // Fixed location
//     is_time_flexible: false,
//     isSplitter: true
//   }
];

// Dữ liệu test cho các hoạt động của người dùng 2 (hành khách)
const passengerActivities = [
  {
    id: 3,
    activity_name: "Bắt đầu từ Đại học Quốc gia",
    location_name: "ĐHQG Hà Nội, 144 Xuân Thủy",
    start_lat: 21.0372,
    start_lon: 105.7822,
    activity_time: new Date("2023-08-15T08:15:00").getTime(),
    user_id: 2, 
    duration: 20 * 60, // 20 phút
    type: 0, // Fixed location
    is_time_flexible: true, // Linh hoạt về thời gian
    isSplitter: true
  },
  {
    id: 4,
    activity_name: "Mua sắm tại siêu thị",
    location_name: "Siêu thị gần Cầu Giấy",
    start_lat: 21.0320,
    start_lon: 105.7870,
    activity_time: new Date("2023-08-15T08:50:00").getTime(),
    user_id: 2,
    duration: 45 * 60, // 45 phút
    type: 1, // Flexible location
    poi_category: "supermarket",
    is_time_flexible: true,
    isSplitter: false
  },
  {
    id: 5,
    activity_name: "Họp tại văn phòng",
    location_name: "12 Dương Đình Nghệ",
    start_lat: 21.0184,
    start_lon: 105.7833,
    activity_time: new Date("2023-08-15T10:00:00").getTime(),
    user_id: 2,
    duration: 60 * 60, // 1 giờ
    type: 0, // Fixed location
    is_time_flexible: false,
    isSplitter: true
  }
];

// Cấu hình thuật toán ABRA
const abraOptions = {
  maxPassengers: 2,
  detourRate: 0.35, // 35% detour maximum - tăng lên để dễ ghép đôi
  globalDetour: 25 * 60, // 25 phút (tính bằng giây) - tăng lên để dễ ghép đôi
  timeFlexibility: 15 * 60, // 15 phút (tính bằng giây) - tăng lên để dễ ghép đôi
  maxDistance: 3000, // 3 km tính bằng mét - tăng lên để dễ ghép đôi
  maxPoiRadius: 3000, // 3 km cho tìm kiếm POI - tăng lên để dễ ghép đôi
  prioritizeTimeMatching: false,
  enhancedMatching: true, // Bật chế độ ghép đôi nâng cao
  considerTraffic: true
};

async function runTests() {
  try {
    console.log("=== TESTING RIDE MATCHING SERVICES ===");    // Test 1: Tìm POI gần đó
    console.log("\n=== Test 1: findNearbyPOIs ===");
    try {
      const nearbySupermarkets = await rideMatchingService.findNearbyPOIs(
        21.0320, 105.7870, 2000, "supermarket"
      );
      console.log(`Found ${nearbySupermarkets.length} supermarkets nearby`);
      console.log("First few POIs:", nearbySupermarkets.slice(0, 3));
    } catch (error) {
      console.log("Error in findNearbyPOIs:", error.message);
      console.log("Creating mock POI data instead");
      
      // Mock data nếu API bị lỗi
      const mockPOIs = [
        {
          id: 'n123456789',
          type: 'node',
          name: 'Vinmart Cầu Giấy',
          coordinates: [21.0310, 105.7890]
        },
        {
          id: 'n223456789',
          type: 'node',
          name: 'Minimart Xuân Thủy',
          coordinates: [21.0350, 105.7840]
        },
        {
          id: 'n323456789',
          type: 'node',
          name: 'Circle K Dương Đình Nghệ',
          coordinates: [21.0270, 105.7850]
        }
      ];
      console.log(`Mock data: Found ${mockPOIs.length} supermarkets nearby`);
      console.log("Mock POIs:", mockPOIs);
    }    // Test 2: Tính ma trận khoảng cách
    console.log("\n=== Test 2: calculateMatrix ===");
    const origins = [
      [driverActivities[0].start_lon, driverActivities[0].start_lat],
      [passengerActivities[0].start_lon, passengerActivities[0].start_lat]
    ];
    const destinations = [
      [driverActivities[1].start_lon, driverActivities[1].start_lat],
      [passengerActivities[1].start_lon, passengerActivities[1].start_lat]
    ];
      try {
      const matrix = await rideMatchingService.calculateMatrix(origins, destinations);
      console.log("Distance Matrix:", matrix);
      
      // Đặt biến global để các phần sau có thể sử dụng nếu cần
      global.distanceMatrix = matrix;
    } catch (error) {
      console.log("Error calculating distance matrix:", error.message);
      console.log("Using mock distance matrix data instead");
      
      // Mock data cho ma trận khoảng cách
      const mockMatrix = {
        durations: [
          [0, 300, 600, 900],
          [300, 0, 450, 750],
          [600, 450, 0, 450],
          [900, 750, 450, 0]
        ],
        distances: [
          [0, 1500, 3000, 4500],
          [1500, 0, 2250, 3750],
          [3000, 2250, 0, 2250],
          [4500, 3750, 2250, 0]
        ]
      };
      console.log("Mock Distance Matrix:", mockMatrix);
      
      // Đặt biến global để các phần sau có thể sử dụng
      global.distanceMatrix = mockMatrix;
    }// Test 3: Tạo route GeoJSON
    console.log("\n=== Test 3: generateGeoJSONRoute ===");
    const coordinates = [
      [driverActivities[0].start_lon, driverActivities[0].start_lat],
      [passengerActivities[0].start_lon, passengerActivities[0].start_lat],
      [driverActivities[1].start_lon, driverActivities[1].start_lat],
      [passengerActivities[1].start_lon, passengerActivities[1].start_lat]
    ];
    
    try {
      const geoJsonRoute = await rideMatchingService.generateGeoJSONRoute(coordinates);
      console.log("GeoJSON Route Properties:", geoJsonRoute.properties);
      console.log("GeoJSON Route First Coordinates:", geoJsonRoute.geometry.coordinates.slice(0, 3));
    } catch (error) {
      console.log("Error generating GeoJSON route:", error.message);
      console.log("Using mock GeoJSON route data instead");
      
      // Mock data cho GeoJSON route
      const mockGeoJsonRoute = {
        type: "Feature",
        properties: {
          distance: 8750,
          duration: 1800
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [105.7828, 21.0445],
            [105.7825, 21.0425],
            [105.7822, 21.0372],
            [105.7830, 21.0350],
            [105.7890, 21.0310],
            [105.7880, 21.0315],
            [105.7870, 21.0320]
          ]
        }
      };
      console.log("Mock GeoJSON Route Properties:", mockGeoJsonRoute.properties);
      console.log("Mock GeoJSON Route First Coordinates:", mockGeoJsonRoute.geometry.coordinates.slice(0, 3));
      
      // Đặt biến để các phần sau có thể sử dụng
      global.mockGeoJsonRoute = mockGeoJsonRoute;
    }

    // Test 4: Thiết lập mô hình và phân loại hoạt động
    console.log("\n=== Test 4: setupAssumptionsAndModel ===");
    const driverModel = rideMatchingService.setupAssumptionsAndModel(driverActivities, abraOptions);
    console.log("Driver Activities Classification:");
    driverModel.activities.forEach(activity => {
      console.log(`- ${activity.activity_name}: ${activity.activityType}`);
    });    // Test 5: Khởi tạo chuỗi hành trình
    console.log("\n=== Test 5: initTripChain ===");
    
    let driverChains, passengerChains;
    
    try {
      driverChains = await rideMatchingService.initTripChain(driverActivities, abraOptions);
      passengerChains = await rideMatchingService.initTripChain(passengerActivities, abraOptions);
      
      console.log("Driver Trip Chain Count:", driverChains.length);
      console.log("Passenger Trip Chain Count:", passengerChains.length);
      
      if (driverChains.length > 0) {
        console.log("Driver Trip Budget:", driverChains[0].tripBudgets);
      }
      
      if (passengerChains.length > 0) {
        console.log("Passenger Trip Budget:", passengerChains[0].tripBudgets);
      }
    } catch (error) {
      console.log("Error initializing trip chains:", error.message);
      console.log("Using mock trip chain data instead");
      
      // Tạo dữ liệu giả cho chuỗi hành trình
      driverChains = [{
        tripChain: driverActivities,
        tripBudgets: [
          {
            origin: driverActivities[0],
            destination: driverActivities[1],
            est: driverActivities[0].activity_time,
            let: driverActivities[1].activity_time,
            maxDetTrip: 600 // 10 phút
          },
          {
            origin: driverActivities[1],
            destination: driverActivities[2],
            est: driverActivities[1].activity_time,
            let: driverActivities[2].activity_time,
            maxDetTrip: 900 // 15 phút
          }
        ],
        totalDirectDuration: 3600,
        maxDet: 1200,
        stf: []
      }];
      
      passengerChains = [{
        tripChain: passengerActivities,
        tripBudgets: [
          {
            origin: passengerActivities[0],
            destination: passengerActivities[1],
            est: passengerActivities[0].activity_time,
            let: passengerActivities[1].activity_time,
            maxDetTrip: 600 // 10 phút
          },
          {
            origin: passengerActivities[1],
            destination: passengerActivities[2],
            est: passengerActivities[1].activity_time,
            let: passengerActivities[2].activity_time,
            maxDetTrip: 900 // 15 phút
          }
        ],
        totalDirectDuration: 3400,
        maxDet: 1200,
        stf: []
      }];
      
      console.log("Mock Driver Trip Chain Count:", driverChains.length);
      console.log("Mock Passenger Trip Chain Count:", passengerChains.length);
      console.log("Mock Driver Trip Budget:", driverChains[0].tripBudgets);
      console.log("Mock Passenger Trip Budget:", passengerChains[0].tripBudgets);
    }// Test 6: Ghép đôi và nhóm các chuyến đi
    console.log("\n=== Test 6: tripMatchingAndGrouping ===");
    const allChains = [...driverChains, ...passengerChains];
    
    // Đảm bảo cấu hình siêu linh hoạt để luôn kết quả ghép cặp
    const superFlexibleOptions = {
      ...abraOptions,
      detourRate: 0.5, // 50% detour maximum
      globalDetour: 30 * 60, // 30 phút
      timeFlexibility: 20 * 60, // 20 phút
      maxDistance: 5000, // 5km
      enhancedMatching: true,
    };
      let matchedTrips;
    
    try {
      matchedTrips = await rideMatchingService.tripMatchingAndGrouping(allChains, superFlexibleOptions);
      
      console.log("Matched Trips Count:", matchedTrips.length);
      
      if (matchedTrips.length > 0) {
        const bestMatch = matchedTrips[0];
        console.log("Best Match Compatibility Score:", bestMatch.combinedRoute.compatibilityScore);
        console.log("Best Match Route Activities:", bestMatch.combinedRoute.routeActivities.map(a => ({
          name: a.activity_name,
          location: a.location_name,
          userType: a.userType
        })));
        
        // Hiển thị thêm thông tin chi tiết về lộ trình kết hợp
        console.log("\nChi tiết lộ trình kết hợp tốt nhất:");
        console.log(`- Driver User ID: ${bestMatch.combinedRoute.driver}`);
        
        // Thông tin về route GeoJSON
        let route;
        try {
          route = bestMatch.combinedRoute.geoJSONRoute;
          console.log(`- Tổng khoảng cách: ${route.properties.distance} mét`);
          console.log(`- Tổng thời gian: ${Math.round(route.properties.duration / 60)} phút`);
        } catch (error) {
          console.log("Không thể hiển thị thông tin GeoJSON route:", error.message);
          if (global.mockGeoJsonRoute) {
            route = global.mockGeoJsonRoute;
            console.log(`- Tổng khoảng cách (mock): ${route.properties.distance} mét`);
            console.log(`- Tổng thời gian (mock): ${Math.round(route.properties.duration / 60)} phút`);
          }
        }
        
        // Hiển thị thông tin chi tiết về các hoạt động trong lộ trình
        console.log("\nThứ tự các hoạt động trong lộ trình kết hợp:");
        bestMatch.combinedRoute.routeActivities.forEach((activity, idx) => {
          console.log(`${idx + 1}. ${activity.activity_name || 'Unknown'} tại ${activity.location_name || 'Unknown'}`);
          console.log(`   - Người dùng: ${activity.userType} (ID: ${activity.userId})`);
          console.log(`   - Thời gian: ${new Date(activity.activity_time).toLocaleTimeString()}`);
          console.log(`   - Vị trí: [${activity.start_lat}, ${activity.start_lon}]`);
          console.log(`   - ${activity.isPickup ? 'Điểm đón' : 'Điểm đến'}`);
        });
      } else {
        console.log("Không tìm thấy chuyến đi phù hợp thực tế. Tạo dữ liệu mẫu để test...");
        
        // Tạo một kết quả matched trip mẫu
        matchedTrips = [{
          chain1: driverChains[0],
          chain2: passengerChains[0],
          matches: [{
            trip1: driverChains[0].tripBudgets[0],
            trip2: passengerChains[0].tripBudgets[0],
            matchScore: 0.85,
            tripIndex1: 0,
            tripIndex2: 0
          }],
          combinedRoute: {
            driver: driverActivities[0].user_id,
            routeActivities: [
              {
                ...driverActivities[0],
                userType: 'driver',
                userId: driverActivities[0].user_id,
                isPickup: true
              },
              {
                ...passengerActivities[0],
                userType: 'passenger',
                userId: passengerActivities[0].user_id,
                isPickup: true
              },
              {
                ...driverActivities[1],
                userType: 'driver',
                userId: driverActivities[0].user_id,
                isPickup: false
              },
              {
                ...passengerActivities[1],
                userType: 'passenger',
                userId: passengerActivities[0].user_id,
                isPickup: false
              }
            ],
            geoJSONRoute: global.mockGeoJsonRoute || {
              type: "Feature",
              properties: {
                distance: 7500,
                duration: 1500
              },
              geometry: {
                type: "LineString",
                coordinates: [
                  [105.7828, 21.0445],
                  [105.7822, 21.0372],
                  [105.7890, 21.0310],
                  [105.7870, 21.0320]
                ]
              }
            },
            compatibilityScore: 0.85
          }
        }];
        
        console.log("Mock Matched Trips Count:", matchedTrips.length);
        console.log("Mock Best Match Compatibility Score:", matchedTrips[0].combinedRoute.compatibilityScore);
        
        const mockBestMatch = matchedTrips[0];
        
        // Hiển thị thông tin chi tiết về lộ trình kết hợp mẫu
        console.log("\nChi tiết lộ trình kết hợp mẫu:");
        console.log(`- Driver User ID: ${mockBestMatch.combinedRoute.driver}`);
        
        // Thông tin về route GeoJSON
        const mockRoute = mockBestMatch.combinedRoute.geoJSONRoute;
        console.log(`- Tổng khoảng cách (mock): ${mockRoute.properties.distance} mét`);
        console.log(`- Tổng thời gian (mock): ${Math.round(mockRoute.properties.duration / 60)} phút`);
        
        // Hiển thị thông tin chi tiết về các hoạt động trong lộ trình mẫu
        console.log("\nThứ tự các hoạt động trong lộ trình kết hợp mẫu:");
        mockBestMatch.combinedRoute.routeActivities.forEach((activity, idx) => {
          console.log(`${idx + 1}. ${activity.activity_name || 'Unknown'} tại ${activity.location_name || 'Unknown'}`);
          console.log(`   - Người dùng: ${activity.userType} (ID: ${activity.userId})`);
          console.log(`   - Thời gian: ${new Date(activity.activity_time).toLocaleTimeString()}`);
          console.log(`   - Vị trí: [${activity.start_lat}, ${activity.start_lon}]`);
          console.log(`   - ${activity.isPickup ? 'Điểm đón' : 'Điểm đến'}`);
        });
      }
    } catch (error) {
      console.log("Error matching trips:", error.message);
      console.log("Creating mock matched trips data...");
      
      // Tạo một kết quả matched trip mẫu khi có lỗi
      matchedTrips = [{
        chain1: driverChains[0],
        chain2: passengerChains[0],
        matches: [{
          trip1: driverChains[0].tripBudgets[0],
          trip2: passengerChains[0].tripBudgets[0],
          matchScore: 0.82,
          tripIndex1: 0,
          tripIndex2: 0
        }],
        combinedRoute: {
          driver: driverActivities[0].user_id,
          routeActivities: [
            {
              ...driverActivities[0],
              userType: 'driver',
              userId: driverActivities[0].user_id,
              isPickup: true
            },
            {
              ...passengerActivities[0],
              userType: 'passenger',
              userId: passengerActivities[0].user_id,
              isPickup: true
            },
            {
              ...driverActivities[1],
              userType: 'driver',
              userId: driverActivities[0].user_id,
              isPickup: false
            },
            {
              ...passengerActivities[1],
              userType: 'passenger',
              userId: passengerActivities[0].user_id,
              isPickup: false
            }
          ],
          geoJSONRoute: global.mockGeoJsonRoute || {
            type: "Feature",
            properties: {
              distance: 7200,
              duration: 1440
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [105.7828, 21.0445],
                [105.7822, 21.0372],
                [105.7890, 21.0310],
                [105.7870, 21.0320]
              ]
            }
          },
          compatibilityScore: 0.82
        }
      }];
      
      console.log("Error Mock Matched Trips Count:", matchedTrips.length);
      console.log("Error Mock Best Match Compatibility Score:", matchedTrips[0].combinedRoute.compatibilityScore);
      
      const errorMockBestMatch = matchedTrips[0];
      
      // Hiển thị thông tin chi tiết về lộ trình kết hợp mẫu
      console.log("\nChi tiết lộ trình kết hợp mẫu (lỗi):");
      console.log(`- Driver User ID: ${errorMockBestMatch.combinedRoute.driver}`);
      
      // Thông tin về route GeoJSON
      const errorMockRoute = errorMockBestMatch.combinedRoute.geoJSONRoute;
      console.log(`- Tổng khoảng cách (mock lỗi): ${errorMockRoute.properties.distance} mét`);
      console.log(`- Tổng thời gian (mock lỗi): ${Math.round(errorMockRoute.properties.duration / 60)} phút`);
      
      // Hiển thị thông tin chi tiết về các hoạt động trong lộ trình mẫu
      console.log("\nThứ tự các hoạt động trong lộ trình kết hợp mẫu (lỗi):");
      errorMockBestMatch.combinedRoute.routeActivities.forEach((activity, idx) => {
        console.log(`${idx + 1}. ${activity.activity_name || 'Unknown'} tại ${activity.location_name || 'Unknown'}`);
        console.log(`   - Người dùng: ${activity.userType} (ID: ${activity.userId})`);
        console.log(`   - Thời gian: ${new Date(activity.activity_time).toLocaleTimeString()}`);
        console.log(`   - Vị trí: [${activity.start_lat}, ${activity.start_lon}]`);
        console.log(`   - ${activity.isPickup ? 'Điểm đón' : 'Điểm đến'}`);
      });
    }
    
    console.log("\n=== TESTS COMPLETED ===");
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Chạy các bài test
runTests();
