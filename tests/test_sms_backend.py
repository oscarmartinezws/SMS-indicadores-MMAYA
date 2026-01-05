"""
SMS Backend API Tests
Tests for Sistema de Monitoreo Sectorial - Backend APIs
Focus: Login, Rendicion (with calculated fields), and data persistence
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://indicador-tracker-1.preview.emergentagent.com')

# Test credentials
TEST_USERNAME = "omartinez"
TEST_PASSWORD = "P1c0l0c0"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["username"] == TEST_USERNAME
        assert data["user"]["rol"] == "ADMINISTRADOR"
        assert "id_area" in data["user"]
        print(f"✓ Login successful for user: {data['user']['nombre']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": "invalid_user",
            "password": "wrong_password"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_verify_token(self):
        """Test token verification endpoint"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Verify token
        response = requests.get(f"{BASE_URL}/api/sms/verify-token", 
                               headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        print("✓ Token verification successful")


class TestMatrizParametros:
    """Tests for matriz_parametros (indicadores) endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_indicadores(self, auth_token):
        """Test getting indicadores list"""
        response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros",
                               headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one indicador"
        
        # Check first indicador structure
        indicador = data[0]
        assert "id_indicador" in indicador
        assert "indicador_resultado" in indicador
        assert "logro" in indicador
        print(f"✓ Got {len(data)} indicadores")


class TestRendicion:
    """Tests for rendicion endpoint - CRUD and calculated fields"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/sms/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_rendicion(self, auth_token):
        """Test getting rendicion data for an indicador"""
        # Get indicadores first
        ind_response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros",
                                   headers={"Authorization": f"Bearer {auth_token}"})
        indicadores = ind_response.json()
        
        if len(indicadores) > 0:
            id_indicador = indicadores[0]["id_indicador"]
            gestion = 2025
            
            response = requests.get(f"{BASE_URL}/api/sms/rendicion/{id_indicador}/{gestion}")
            assert response.status_code == 200
            print(f"✓ Got rendicion for indicador {id_indicador}, year {gestion}")
    
    def test_save_rendicion_with_calculated_fields(self, auth_token):
        """Test saving rendicion with calculated % EJEC and ACUMULADO fields"""
        # Get indicadores first
        ind_response = requests.get(f"{BASE_URL}/api/sms/matriz_parametros",
                                   headers={"Authorization": f"Bearer {auth_token}"})
        indicadores = ind_response.json()
        
        if len(indicadores) > 0:
            id_indicador = indicadores[0]["id_indicador"]
            programado = float(indicadores[0].get("logro", 51) or 51)
            gestion = 2025
            
            # Test data with EJECUCIÓN values
            test_ejecutado_ene = 10.0
            test_ejecutado_feb = 15.0
            
            # Calculate expected values
            expected_proc_ene = test_ejecutado_ene / programado if programado > 0 else 0
            expected_proc_feb = test_ejecutado_feb / programado if programado > 0 else 0
            expected_acum_ene = test_ejecutado_ene
            expected_acum_feb = test_ejecutado_ene + test_ejecutado_feb
            expected_logrado = expected_acum_feb
            
            # Save rendicion
            payload = {
                "id_indicador": id_indicador,
                "gestion": gestion,
                "id_area": 1,
                "programado": programado,
                "ejecutado_ene": test_ejecutado_ene,
                "ejecutado_feb": test_ejecutado_feb,
                "proc_ejecutado_ene": expected_proc_ene,
                "proc_ejecutado_feb": expected_proc_feb,
                "acumulado_ene": expected_acum_ene,
                "acumulado_feb": expected_acum_feb,
                "logrado": expected_logrado
            }
            
            response = requests.post(f"{BASE_URL}/api/sms/rendicion", json=payload)
            assert response.status_code == 200, f"Save failed: {response.text}"
            print(f"✓ Saved rendicion with calculated fields")
            
            # Verify persistence by fetching again
            get_response = requests.get(f"{BASE_URL}/api/sms/rendicion/{id_indicador}/{gestion}")
            assert get_response.status_code == 200
            
            saved_data = get_response.json()
            
            # Verify calculated fields were saved
            assert float(saved_data.get("ejecutado_ene", 0)) == test_ejecutado_ene, "ejecutado_ene not persisted"
            assert float(saved_data.get("ejecutado_feb", 0)) == test_ejecutado_feb, "ejecutado_feb not persisted"
            
            # Verify % EJEC calculation (proc_ejecutado)
            saved_proc_ene = float(saved_data.get("proc_ejecutado_ene", 0))
            assert abs(saved_proc_ene - expected_proc_ene) < 0.01, f"proc_ejecutado_ene incorrect: {saved_proc_ene} vs {expected_proc_ene}"
            
            # Verify ACUMULADO calculation
            saved_acum_feb = float(saved_data.get("acumulado_feb", 0))
            assert abs(saved_acum_feb - expected_acum_feb) < 0.01, f"acumulado_feb incorrect: {saved_acum_feb} vs {expected_acum_feb}"
            
            print(f"✓ Verified calculated fields persisted correctly")
            print(f"  - ejecutado_ene: {test_ejecutado_ene}")
            print(f"  - ejecutado_feb: {test_ejecutado_feb}")
            print(f"  - proc_ejecutado_ene (% EJEC): {saved_proc_ene:.4f}")
            print(f"  - acumulado_feb (ACUMULADO): {saved_acum_feb}")


class TestContextoUsuario:
    """Tests for user context endpoint"""
    
    def test_get_contexto_usuario(self):
        """Test getting user context (area, entidad, sector)"""
        response = requests.get(f"{BASE_URL}/api/sms/contexto_usuario/1")
        assert response.status_code == 200
        
        data = response.json()
        # Should have area, entidad, sector fields
        assert "area" in data or "entidad" in data or "sector" in data
        print(f"✓ Got user context: {data}")


class TestConfiguracion:
    """Tests for configuration endpoints"""
    
    def test_get_configuracion(self):
        """Test getting system configuration"""
        response = requests.get(f"{BASE_URL}/api/sms/configuracion")
        assert response.status_code == 200
        
        data = response.json()
        assert "plan_anio_inicio" in data
        assert "plan_anio_fin" in data
        print(f"✓ Got configuration: years {data.get('plan_anio_inicio')} - {data.get('plan_anio_fin')}")
    
    def test_get_configuracion_years(self):
        """Test getting available years from configuration"""
        response = requests.get(f"{BASE_URL}/api/sms/configuracion/years")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Got available years: {data}")


class TestMenu:
    """Tests for menu endpoints"""
    
    def test_get_menu_by_role(self):
        """Test getting menu items by role"""
        response = requests.get(f"{BASE_URL}/api/sms/menu/1")  # Role 1 = ADMINISTRADOR
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} menu items for role 1")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
