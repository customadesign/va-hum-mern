  // Fetch max VAs per page setting
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getConfig();
        return response.data;
      } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
      }
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the settings
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  // Update maxVAsPerPage when settings are loaded
  useEffect(() => {
    if (settingsData && settingsData.max_vas_per_page && settingsData.max_vas_per_page.value) {
      const newMaxVAs = Number(settingsData.max_vas_per_page.value);
      console.log('Updating maxVAsPerPage from settings:', newMaxVAs);
      setMaxVAsPerPage(newMaxVAs);
    }
  }, [settingsData]);
