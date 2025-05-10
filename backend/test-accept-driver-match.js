// test-accept-driver-match.js
// File này test chức năng chấp nhận tài xế ghép đôi 

const { acceptDriverMatch, findMatchingDrivers } = require('./services/ride-matching.service');
const { ActivityChain, Activity, User, sequelize } = require('./models');

/**
 * Script này mô phỏng quá trình hành khách chấp nhận một tài xế đã được ghép đôi
 * Và kiểm tra xem hệ thống có cập nhật dữ liệu đúng không
 */
async function testAcceptDriverMatch() {
  try {
    console.log("=== TESTING ACCEPT DRIVER MATCH ===");
    
    // Thông tin đầu vào
    const passengerChainId = 2; // ID của chuỗi hoạt động hành khách
    const driverChainId = 1;    // ID của chuỗi hoạt động tài xế
    const passengerId = 2;      // ID của người dùng hành khách
    
    console.log(`Accepting driver match:`);
    console.log(`- Passenger Chain ID: ${passengerChainId}`);
    console.log(`- Driver Chain ID: ${driverChainId}`);
    console.log(`- Passenger User ID: ${passengerId}`);
    
    // Gọi hàm chấp nhận ghép đôi
    // Trong môi trường test, nếu không có database thì sẽ bị lỗi
    try {
      const result = await acceptDriverMatch(
        passengerChainId,
        driverChainId,
        passengerId
      );
      
      console.log("\nMatch accepted successfully!");
      console.log("Updated Passenger Chain:", result.passengerChain.id);
      console.log("Merged with Driver Chain:", result.driverChain.id);
      
      // Hiển thị thông tin về tuyến đường đã được ghép
      const mergedRoute = result.mergedRoute;
      console.log("\nMerged Route:");
      console.log(`- Activities (${mergedRoute.activities.length}):`);
      
      mergedRoute.activities.forEach((activity, idx) => {
        console.log(`  ${idx + 1}. ${activity.name} at ${activity.location}`);
        console.log(`     User Type: ${activity.userType}, Matched: ${activity.isMatched}`);
        console.log(`     Coordinates: [${activity.coordinates.join(', ')}]`);
        console.log(`     Time: ${new Date(activity.time).toLocaleTimeString()}`);
      });
      
      // Hiển thị thông tin về GeoJSON route
      const route = mergedRoute.route;
      console.log("\nRoute Details:");
      console.log(`- Distance: ${route.properties.distance} meters`);
      console.log(`- Duration: ${route.properties.duration} seconds`);
      console.log(`- Waypoints: ${route.geometry.coordinates.length}`);
      
    } catch (error) {
      console.error(`Error calling acceptDriverMatch:`, error.message);
      console.log("\nInstead, let's test with mock data...");
      
      // Tạo dữ liệu mẫu để test
      const mockAcceptResult = createMockAcceptResult();
      
      console.log("\nMock Match accepted successfully!");
      console.log("Updated Passenger Chain:", mockAcceptResult.passengerChain.id);
      console.log("Merged with Driver Chain:", mockAcceptResult.driverChain.id);
      
      // Hiển thị thông tin về tuyến đường đã được ghép
      const mergedRoute = mockAcceptResult.mergedRoute;
      console.log("\nMerged Route:");
      console.log(`- Activities (${mergedRoute.activities.length}):`);
      
      mergedRoute.activities.forEach((activity, idx) => {
        console.log(`  ${idx + 1}. ${activity.name} at ${activity.location}`);
        console.log(`     User Type: ${activity.userType}, Matched: ${activity.isMatched}`);
        console.log(`     Coordinates: [${activity.coordinates.join(', ')}]`);
        console.log(`     Time: ${new Date(activity.time).toLocaleTimeString()}`);
      });
      
      // Hiển thị thông tin về GeoJSON route
      const route = mergedRoute.route;
      console.log("\nRoute Details:");
      console.log(`- Distance: ${route.properties.distance} meters`);
      console.log(`- Duration: ${route.properties.duration} seconds`);
      console.log(`- Waypoints: ${route.geometry.coordinates.length}`);
    }
    
    console.log("\n=== ACCEPT DRIVER MATCH TEST COMPLETED ===");
    
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

/**
 * Tạo dữ liệu mẫu cho việc test trong trường hợp không có database
 */
function createMockAcceptResult() {
  return {
    passengerChain: {
      id: 2,
      user_id: 2,
      is_passenger: true,
      matched_driver_chain_id: 1,
      match_timestamp: Date.now()
    },
    driverChain: {
      id: 1, 
      user_id: 1,
      is_driver: true
    },
    mergedRoute: {
      activities: [
        {
          id: 101,
          name: "Bắt đầu từ Bộ Công an",
          location: "Bộ Công an, 47 Phạm Văn Đồng",
          time: new Date("2023-08-15T08:00:00").getTime(),
          duration: 1800,
          coordinates: [105.7828, 21.0445],
          userType: "driver",
          isMatched: false,
          matchDetails: null
        },
        {
          id: 201,
          name: "Đón khách tại Đại học Quốc gia",
          location: "ĐHQG Hà Nội, 144 Xuân Thủy",
          time: new Date("2023-08-15T08:15:00").getTime(),
          duration: 1200,
          coordinates: [105.7822, 21.0372],
          userType: "passenger",
          isMatched: false,
          matchDetails: null
        },
        {
          id: 202,
          name: "Ghé siêu thị Vinmart Cầu Giấy",
          location: "Vinmart Cầu Giấy",
          time: new Date("2023-08-15T08:40:00").getTime(),
          duration: 2700,
          coordinates: [105.7890, 21.0321],
          userType: "passenger",
          isMatched: true,
          matchDetails: {
            alternativePOIs: [
              {
                id: 1001,
                name: "Vinmart Cầu Giấy",
                coordinates: [105.7890, 21.0321]
              }
            ],
            score: 0.88,
            distance: 480
          }
        },
        {
          id: 102,
          name: "Đến Mobifone",
          location: "Mobifone, Cầu Giấy",
          time: new Date("2023-08-15T09:00:00").getTime(),
          duration: 7200,
          coordinates: [105.7823, 21.0305],
          userType: "driver",
          isMatched: false,
          matchDetails: null
        },
        {
          id: 203,
          name: "Đến văn phòng họp",
          location: "12 Dương Đình Nghệ",
          time: new Date("2023-08-15T10:00:00").getTime(),
          duration: 3600,
          coordinates: [105.7833, 21.0184],
          userType: "passenger",
          isMatched: false,
          matchDetails: null
        }
      ],
      route: {
        type: "Feature",
        properties: {
          distance: 7500,
          duration: 2400
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [105.7828, 21.0445],
            [105.7825, 21.0425],
            [105.7822, 21.0372],
            [105.7830, 21.0350],
            [105.7890, 21.0321],
            [105.7860, 21.0310],
            [105.7823, 21.0305],
            [105.7820, 21.0250],
            [105.7833, 21.0184]
          ]
        }
      }
    }
  };
}

// Chạy test
testAcceptDriverMatch();
