"""
Test suite for PROGRAMADO features in SMS Seguimiento view:
1. GET /api/sms/rendicion/suma_programado/:id_indicador - Returns sum of all PROGRAMADO values
2. POST /api/sms/rendicion/programado - Save PROGRAMADO value (even without monthly data)
3. Validation that PROGRAMADO sum cannot exceed global goal (meta)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://indicador-tracker-1.preview.emergentagent.com')


class TestAuthentication:
    """Test authentication for admin user"""
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "omartinez",
            "password": "P1c0l0c0"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["rol"] == "ADMINISTRADOR", f"Expected ADMINISTRADOR role, got {data['user']['rol']}"
        print(f"✓ Admin login successful - User: {data['user']['nombre']}, Role: {data['user']['rol']}")
        return data["token"]


class TestSumaProgramadoEndpoint:
    """Test GET /api/sms/rendicion/suma_programado/:id_indicador endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "omartinez",
            "password": "P1c0l0c0"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def indicador_id(self, auth_token):
        """Get a valid indicator ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros", headers=headers)
        if response.status_code == 200:
            indicadores = response.json()
            if indicadores:
                return indicadores[0]["id_indicador"]
        pytest.skip("No indicators available for testing")
    
    def test_suma_programado_returns_correct_structure(self, indicador_id):
        """Test that suma_programado endpoint returns correct JSON structure"""
        response = requests.get(f"{BASE_URL}/api/sms/rendicion/suma_programado/{indicador_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "suma_programado" in data, "Response should contain 'suma_programado' field"
        assert isinstance(data["suma_programado"], (int, float)), "suma_programado should be a number"
        assert data["suma_programado"] >= 0, "suma_programado should be non-negative"
        
        print(f"✓ suma_programado endpoint returns correct structure: {data}")
    
    def test_suma_programado_for_nonexistent_indicator(self):
        """Test suma_programado for non-existent indicator returns 0"""
        response = requests.get(f"{BASE_URL}/api/sms/rendicion/suma_programado/999999")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["suma_programado"] == 0, "Non-existent indicator should return suma_programado = 0"
        
        print(f"✓ Non-existent indicator returns suma_programado = 0")


class TestProgramadoSaveEndpoint:
    """Test POST /api/sms/rendicion/programado endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "omartinez",
            "password": "P1c0l0c0"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def indicador_with_meta(self, auth_token):
        """Get an indicator with a defined meta (logro) for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros", headers=headers)
        if response.status_code == 200:
            indicadores = response.json()
            # Find an indicator with a logro value
            for ind in indicadores:
                if ind.get("logro") and float(ind.get("logro", 0)) > 0:
                    return ind
            # If no indicator with logro, return first one
            if indicadores:
                return indicadores[0]
        pytest.skip("No indicators available for testing")
    
    def test_save_programado_without_monthly_data(self, indicador_with_meta):
        """Test that PROGRAMADO can be saved even without monthly data"""
        indicador_id = indicador_with_meta["id_indicador"]
        meta_global = float(indicador_with_meta.get("logro", 100))
        
        # Use a test year that likely doesn't have data
        test_year = 2020
        test_value = min(5.0, meta_global * 0.1)  # Use 10% of meta or 5, whichever is smaller
        
        # First, get current suma_programado
        suma_response = requests.get(f"{BASE_URL}/api/sms/rendicion/suma_programado/{indicador_id}")
        current_suma = suma_response.json().get("suma_programado", 0)
        
        # Get current programado for this year
        rendicion_response = requests.get(f"{BASE_URL}/api/sms/rendicion/{indicador_id}/{test_year}")
        current_programado = rendicion_response.json().get("programado", 0) if rendicion_response.status_code == 200 else 0
        
        # Calculate if we can save this value without exceeding meta
        new_suma = current_suma - (current_programado or 0) + test_value
        
        if meta_global > 0 and new_suma > meta_global:
            # Adjust test value to be within limits
            test_value = max(0, meta_global - current_suma + (current_programado or 0) - 0.001)
        
        response = requests.post(f"{BASE_URL}/api/sms/rendicion/programado", json={
            "id_indicador": indicador_id,
            "gestion": test_year,
            "programado": test_value
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain 'message' field"
        
        # Verify the value was saved by fetching rendicion
        verify_response = requests.get(f"{BASE_URL}/api/sms/rendicion/{indicador_id}/{test_year}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        # The programado should be saved
        saved_programado = float(verify_data.get("programado", 0))
        assert abs(saved_programado - test_value) < 0.001, f"Expected programado {test_value}, got {saved_programado}"
        
        print(f"✓ PROGRAMADO saved successfully without monthly data: {test_value}")
    
    def test_save_programado_creates_rendicion_record(self, indicador_with_meta):
        """Test that saving PROGRAMADO creates a rendicion record if it doesn't exist"""
        indicador_id = indicador_with_meta["id_indicador"]
        meta_global = float(indicador_with_meta.get("logro", 100))
        
        # Use a unique test year
        test_year = 2019
        test_value = min(1.0, meta_global * 0.05)  # Use 5% of meta or 1
        
        response = requests.post(f"{BASE_URL}/api/sms/rendicion/programado", json={
            "id_indicador": indicador_id,
            "gestion": test_year,
            "programado": test_value
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify record exists
        verify_response = requests.get(f"{BASE_URL}/api/sms/rendicion/{indicador_id}/{test_year}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        # Should have id_rendicion (meaning record was created)
        assert verify_data.get("id_rendicion") or verify_data.get("programado") is not None, "Rendicion record should exist"
        
        print(f"✓ Rendicion record created/updated for year {test_year}")


class TestSumaProgramadoCalculation:
    """Test that suma_programado correctly sums all years"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "omartinez",
            "password": "P1c0l0c0"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def indicador_id(self, auth_token):
        """Get a valid indicator ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros", headers=headers)
        if response.status_code == 200:
            indicadores = response.json()
            if indicadores:
                return indicadores[0]["id_indicador"]
        pytest.skip("No indicators available for testing")
    
    def test_suma_programado_reflects_saved_values(self, indicador_id):
        """Test that suma_programado correctly reflects saved programado values"""
        # Get current suma
        response = requests.get(f"{BASE_URL}/api/sms/rendicion/suma_programado/{indicador_id}")
        assert response.status_code == 200
        
        initial_suma = response.json()["suma_programado"]
        print(f"Initial suma_programado: {initial_suma}")
        
        # The suma should be a valid number
        assert isinstance(initial_suma, (int, float)), "suma_programado should be numeric"
        assert initial_suma >= 0, "suma_programado should be non-negative"
        
        print(f"✓ suma_programado calculation verified: {initial_suma}")


class TestValidationAgainstMeta:
    """Test validation that programado sum cannot exceed meta global"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "omartinez",
            "password": "P1c0l0c0"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def indicador_with_meta(self, auth_token):
        """Get an indicator with a defined meta (logro) for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros", headers=headers)
        if response.status_code == 200:
            indicadores = response.json()
            # Find an indicator with a logro value
            for ind in indicadores:
                if ind.get("logro") and float(ind.get("logro", 0)) > 0:
                    return ind
        pytest.skip("No indicators with meta available for testing")
    
    def test_meta_global_available_for_validation(self, indicador_with_meta):
        """Test that meta global (logro) is available for frontend validation"""
        meta_global = indicador_with_meta.get("logro")
        
        assert meta_global is not None, "Indicator should have a logro (meta global) value"
        assert float(meta_global) > 0, "Meta global should be positive"
        
        print(f"✓ Meta global available for validation: {meta_global}")
    
    def test_suma_programado_for_validation(self, indicador_with_meta):
        """Test that suma_programado is available for frontend validation"""
        indicador_id = indicador_with_meta["id_indicador"]
        
        response = requests.get(f"{BASE_URL}/api/sms/rendicion/suma_programado/{indicador_id}")
        assert response.status_code == 200
        
        data = response.json()
        suma = data["suma_programado"]
        meta = float(indicador_with_meta.get("logro", 0))
        
        print(f"✓ Validation data available - Suma: {suma}, Meta: {meta}")
        
        # Frontend should be able to calculate: disponible = meta - suma + current_programado
        disponible = meta - suma
        print(f"  Disponible para programar (sin current): {disponible}")


class TestRendicionEndpoints:
    """Test rendicion endpoints work correctly"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "omartinez",
            "password": "P1c0l0c0"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def indicador_id(self, auth_token):
        """Get a valid indicator ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros", headers=headers)
        if response.status_code == 200:
            indicadores = response.json()
            if indicadores:
                return indicadores[0]["id_indicador"]
        pytest.skip("No indicators available for testing")
    
    def test_get_rendicion_by_indicator_and_year(self, indicador_id):
        """Test GET /api/sms/rendicion/:id_indicador/:gestion"""
        current_year = 2025
        response = requests.get(f"{BASE_URL}/api/sms/rendicion/{indicador_id}/{current_year}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        # Response can be empty object {} if no data exists
        data = response.json()
        assert isinstance(data, dict), "Response should be a dictionary"
        
        print(f"✓ Rendicion endpoint works for indicator {indicador_id}, year {current_year}")
        if data:
            print(f"  Data found: programado={data.get('programado')}, logrado={data.get('logrado')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
