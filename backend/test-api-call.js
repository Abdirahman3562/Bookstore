import axios from 'axios';

const testApiCall = async () => {
  try {
    // Use the admin token from localStorage (we'll get it from the browser)
    // For now, let's make a call that should fail to see the debugging
    const response = await axios.get('http://localhost:3000/api/website-settings', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTUyNWMwMjAwNDJjN2U2NzM0ZjZmYiIsImVtYWlsIjoibWFhbkBnbWFpbC5jb20iLCJhZG1pblJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7ImRhc2hib2FyZCI6dHJ1ZSwiYm9va3MiOnRydWUsImRvd25sb2FkcyI6dHJ1ZSwicHVyY2hhc2VkIjp0cnVlLCJ0ZXN0aW1vbmlhbHMiOnRydWUsInVzZXJzIjp0cnVlLCJhdXRob3JzIjp0cnVlLCJibG9ncyI6dHJ1ZSwiYWRkQWRtaW5Vc2VyIjp0cnVlLCJsaXZlQ2hhdCI6dHJ1ZSwiY29udGFjdHMiOnRydWUsIndlYnNpdGVTZXR0aW5ncyI6dHJ1ZX0sInRlbmFudElkIjoiNjk1NTI1ZDAyMDA0MmM3ZTY3MzRmNmZiIiwiaWF0IjoxNzM1MzE5ODM5LCJleHAiOjE3MzUzMjM0Mzl9.Bearer'
      }
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testApiCall();

