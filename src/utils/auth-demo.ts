// Utility for demo authentication
export const createTestUser = async () => {
  try {
    // This function would normally create a test user
    // For now, we'll return a success message
    console.log('Demo user creation would happen here');
    return { success: true };
  } catch (error) {
    console.error('Error creating test user:', error);
    return { success: false, error };
  }
};

// Demo credentials for testing
export const DEMO_CREDENTIALS = {
  email: 'admin@estrategica.com',
  password: '123456'
};