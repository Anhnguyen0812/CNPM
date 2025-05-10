// test-driver-matching.js
// File này test chức năng tìm kiếm tài xế phù hợp với hành khách

const { findMatchingDrivers } = require('./services/ride-matching.service');
const { ActivityChain, Activity, User, Vehicle, sequelize } = require('./models');

/**
 * Script này mô phỏng quá trình tìm kiếm tài xế phù hợp từ database
 * Nó giả lập cách mà hệ thống tìm kiếm sẽ hoạt động khi một hành khách muốn
 * tìm tài xế có hành trình tương thích
 */
async function testDriverMatching() {
  try {
    console.log("=== TESTING DRIVER MATCHING ===");
    
    // Tạo một chain ID giả lập
    // Trong thực tế, chain ID sẽ là ID của chuỗi hoạt động hành khách
    const passengerChainId = 1; 
    const passengerId = 2;
    
    const timeWindow = 15; // 15 phút
    const maxDistance = 2000; // 2km
    
    // Tùy chọn nâng cao 
    const options = {
      prioritizeTimeMatching: false,
      enhancedMatching: true,
      considerTraffic: true,
      maxDetourPercent: 25,
      weightTimeFactors: true,
      useTimeFlexibility: true
    };
    
    console.log(`Searching for matching drivers for chain ${passengerChainId} with options:`);
    console.log(`- Time Window: ${timeWindow} minutes`);
    console.log(`- Max Distance: ${maxDistance} meters`);
    console.log(`- Advanced Options:`, options);
    
    // Gọi hàm tìm kiếm tài xế phù hợp
    // Trong môi trường test, nếu không có database thì sẽ bị lỗi
    // Vì function sẽ tìm kiếm dữ liệu từ database thực tế
    try {
      const matches = await findMatchingDrivers(
        passengerChainId,
        passengerId,
        timeWindow,
        maxDistance,
        options
      );
      
      console.log(`Found ${matches.length} matching drivers`);
      
      if (matches.length > 0) {
        // Show thông tin về các tài xế phù hợp
        matches.forEach((match, index) => {
          console.log(`\nMatch #${index + 1}:`);
          console.log(`- Driver: ${match.driver?.name || 'Unknown'} (ID: ${match.driverChain.user_id})`);
          console.log(`- Compatibility Score: ${match.compatibilityScore.toFixed(2)}`);
          console.log(`- Compatible Activities: ${match.compatibleActivities}/${match.totalActivities}`);
          console.log(`- Average Distance: ${match.averageDistance.toFixed(2)} meters`);
          
          // Hiển thị chi tiết về tuyến đường kết hợp
          const route = match.combinedRoute;
          console.log(`\nCombined Route:`);
          console.log(`- Driver: ${route.driver}`);
          console.log(`- Activities (${route.routeActivities.length}):`);
          
          route.routeActivities.forEach((activity, actIdx) => {
            console.log(`  ${actIdx + 1}. ${activity.activity_name || 'Unknown'} at ${activity.location_name || 'Unknown'}`);
            console.log(`     User: ${activity.userType} (ID: ${activity.userId}), Pickup: ${activity.isPickup}`);
          });
          
          // Hiển thị thông tin về route GeoJSON
          const geoRoute = route.geoJSONRoute;
          console.log(`\nRoute Details:`);
          console.log(`- Distance: ${geoRoute.properties.distance} meters`);
          console.log(`- Duration: ${geoRoute.properties.duration} seconds`);
          console.log(`- Waypoints: ${geoRoute.geometry.coordinates.length}`);
        });
      } else {
        console.log("No matching drivers found");
      }
    } catch (error) {
      console.error(`Error calling findMatchingDrivers:`, error.message);
      console.log("\nInstead, let's test with mock data...");
      
      // Tạo dữ liệu mẫu để test 
      const mockMatchingResult = createMockDriverMatches();
      console.log(`Found ${mockMatchingResult.length} mock matching drivers`);
      
      if (mockMatchingResult.length > 0) {
        mockMatchingResult.forEach((match, index) => {
          console.log(`\nMock Match #${index + 1}:`);
          console.log(`- Driver: ${match.driver.name} (ID: ${match.driver.id})`);
          console.log(`- Compatibility Score: ${match.compatibilityScore.toFixed(2)}`);
          console.log(`- Compatible Activities: ${match.compatibleActivities}/${match.totalActivities}`);
          
          // Hiển thị chi tiết về tuyến đường kết hợp
          const route = match.route;
          console.log(`\nCombined Route:`);
          console.log(`- Activities (${route.activities.length}):`);
          
          route.activities.forEach((activity, actIdx) => {
            console.log(`  ${actIdx + 1}. ${activity.name} at ${activity.location}`);
            console.log(`     User: ${activity.userType}, Time: ${new Date(activity.time).toLocaleTimeString()}`);
          });
        });
      }
    }
    
    console.log("\n=== DRIVER MATCHING TEST COMPLETED ===");
    
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

/**
 * Tạo dữ liệu mẫu cho việc test trong trường hợp không có database
 */
function createMockDriverMatches() {
  return [
    {
      driver: {
        id: 1,
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        profile_picture: "https://example.com/avatar1.jpg"
      },
      driverChain: {
        id: 10,
        user_id: 1,
        is_driver: true
      },
      compatibilityScore: 0.85,
      compatibleActivities: 2,
      totalActivities: 3,
      averageDistance: 1250,
      route: {
        activities: [
          {
            id: 101,
            name: "Bắt đầu từ Bộ Công an",
            location: "Bộ Công an, 47 Phạm Văn Đồng",
            time: new Date("2023-08-15T08:00:00").getTime(),
            userType: "driver", 
            isPickup: true
          },
          {
            id: 201,
            name: "Đón khách tại Đại học Quốc gia",
            location: "ĐHQG Hà Nội, 144 Xuân Thủy",
            time: new Date("2023-08-15T08:15:00").getTime(),
            userType: "passenger",
            isPickup: true
          },
          {
            id: 202,
            name: "Ghé siêu thị Vinmart Cầu Giấy",
            location: "Vinmart Cầu Giấy",
            time: new Date("2023-08-15T08:40:00").getTime(),
            userType: "passenger",
            isPickup: false
          },
          {
            id: 102,
            name: "Đến Mobifone",
            location: "Mobifone, Cầu Giấy",
            time: new Date("2023-08-15T09:00:00").getTime(),
            userType: "driver",
            isPickup: false
          }
        ],
        geoJson: {
          type: "Feature",
          properties: {
            distance: 5200,
            duration: 1800
          }
        }
      }
    },
    {
      driver: {
        id: 3,
        name: "Trần Văn B",
        email: "tranvanb@example.com",
        profile_picture: "https://example.com/avatar3.jpg"
      },
      driverChain: {
        id: 12,
        user_id: 3,
        is_driver: true
      },
      compatibilityScore: 0.72,
      compatibleActivities: 1,
      totalActivities: 3,
      averageDistance: 1500,
      route: {
        activities: [
          {
            id: 301,
            name: "Bắt đầu từ Keangnam",
            location: "Tòa nhà Keangnam, Phạm Hùng",
            time: new Date("2023-08-15T08:05:00").getTime(),
            userType: "driver",
            isPickup: true
          },
          {
            id: 201,
            name: "Đón khách tại Đại học Quốc gia",
            location: "ĐHQG Hà Nội, 144 Xuân Thủy", 
            time: new Date("2023-08-15T08:20:00").getTime(),
            userType: "passenger",
            isPickup: true
          },
          {
            id: 302,
            name: "Đến văn phòng",
            location: "Tòa nhà CIC, Duy Tân",
            time: new Date("2023-08-15T08:55:00").getTime(),
            userType: "driver",
            isPickup: false
          },
          {
            id: 203,
            name: "Đến văn phòng họp",
            location: "12 Dương Đình Nghệ",
            time: new Date("2023-08-15T09:45:00").getTime(),
            userType: "passenger",
            isPickup: false
          }
        ],
        geoJson: {
          type: "Feature",
          properties: {
            distance: 6500,
            duration: 2100
          }
        }
      }
    }
  ];
}

// Chạy test
testDriverMatching();
