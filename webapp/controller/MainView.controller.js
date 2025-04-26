sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * 
     * @param {typeof sap/ui/core/mvc/Controller} Controller 
     *
     */

    function (Controller) {
        "use strict";

        /**
         * @namespace logaligroup.retosapui5.controller
         * @name logaligroup.retosapui5.controller.MainView
         * @description Controller principal para la vista MainView. Maneja la lógica de formulario y tabla de usuarios.
         */

        return Controller.extend("logaligroup.retosapui5.controller.MainView", {
            /**
             * Carga inicial de modelos, bindeo de funciones de cambio de país/provincia y bindeo de inputs.
             * @public
            */
            onInit: function () {
                const oView = this.getView();

                const oFormDataModel = new sap.ui.model.json.JSONModel();
                oFormDataModel.loadData("../model/formData.json");
                oView.setModel(oFormDataModel, "formData");

                const oSavedDataModel = new sap.ui.model.json.JSONModel();
                oSavedDataModel.loadData("../model/savedData.json");
                oView.setModel(oSavedDataModel, "savedData");

                oView.byId("slCountry").attachChange(this.onCountryChange.bind(this));
                oView.byId("slProvince").attachChange(this.onProvinceChange.bind(this));

                this._bindInputs();
            },
            /**
             * Actualiza las provincias según el país seleccionado.
             * @public
             * @param {sap.ui.base.Event} oEvent Evento de cambio del país.
             */
            onCountryChange: function (oEvent) {
                const sSelectedCountryKey = oEvent.getSource().getSelectedKey();
                const oModel = this.getView().getModel("formData");
                const aAllProvinces = oModel.getProperty("/provinces");

                const aFiltered = aAllProvinces.filter(prov => prov.countryKey === sSelectedCountryKey);

                oModel.setProperty("/filteredProvinces", aFiltered);
                oModel.setProperty("/recoveredData/province", "");
            },
            /**
             * Actualiza las regiones según la provincia seleccionada.
             * @public
             * @param {sap.ui.base.Event} oEvent Evento de cambio de provincia.
             */
            onProvinceChange: function (oEvent) {
                const sProvinceKey = oEvent.getSource().getSelectedKey();
                const oModel = this.getView().getModel("formData");
                const aAllRegions = oModel.getProperty("/regions");

                let aFiltered = aAllRegions.filter(r => r.provinceKey === sProvinceKey);

                if (aFiltered.length === 0) {
                    aFiltered = [{
                        key: "NA",
                        text: "N/A"
                    }];
                }

                oModel.setProperty("/filteredRegions", aFiltered);
                oModel.setProperty("/recoveredData/region", "");
            },
            /**
             * Guarda los datos del formulario si la validación tiene éxito.
             * @public
             */
            onSave: function () {
                this._bindInputs();
                const bInputsValid = this._validateInputs();
                const bSelectsValid = this._validateSelects();

                if (bInputsValid && bSelectsValid) {
                    this._saveData(); // solo si todo es válido
                    this._clearFormData();                    
                }
            },
            /**
             * Limpia todos los campos del formulario al clickar el botón.
             * @public
             */
            onClearForm: function () {
                this._clearFormData();
            },
            /**
             * Borra todos los datos guardados.
             * @public
             */
            onClearData: function () {
                const oModel = this.getView().getModel("savedData");
                oModel.setProperty("/savedData", []);

                const oTable = this.getView().byId("tUserData");
                oTable.getBinding("items").refresh();
                this._updateTableHeader();
            },
            /**
             * Actualiza el encabezado de la tabla después del renderizado.
             * @public
             */
            onAfterRendering: function () {

                this._updateTableHeader();

            },
            /**
             * Muestra un diálogo con información adicional (más columnas).
             * @public
             */
            onShowMoreColumnsPress: function () {
                var oDialog = this.byId("columnDialog");

                if (!oDialog) {
                    oDialog = new Dialog({
                        title: "Additional Information",
                        content: [
                            this.byId("tAdditionalColumns")
                        ],
                        beginButton: new Button({
                            text: "Close",
                            press: this.onCloseDialogPress.bind(this)
                        })
                    });

                    this.getView().addDependent(oDialog);
                }

                oDialog.open();
            },
            /**
             * Cierra el diálogo de información adicional.
             * @public
             */
            onCloseDialogPress: function () {
                this.byId("columnDialog").close();
            },
            /**
             * Bindea los inputs a los campos del modelo recoveredData.
             * @private
             */
            _bindInputs: function () {
                const oView = this.getView();
                const s = sap.ui.model.type.String;
                const d = sap.ui.model.type.Date;

                const oShort = new s({}, { minLength: 2, maxLength: 100 });
                const oEmail = new s({}, { format: "email" });
                const oPhone = new s({}, { minLength: 5, maxLength: 20 });
                const oDoc = new s({}, { minLength: 5, maxLength: 20 });
                const oPostal = new s({}, { minLength: 3, maxLength: 10 });

                oView.byId("inputId").bindValue("formData>/recoveredData/ID", oShort);
                oView.byId("inputFName").bindValue("formData>/recoveredData/firstName", oShort);
                oView.byId("inputLName").bindValue("formData>/recoveredData/lastName", oShort);
                oView.byId("inputNumberDoc").bindValue("formData>/recoveredData/numberDocument", oDoc);
                oView.byId("inputAddress").bindValue("formData>/recoveredData/address", oShort);
                oView.byId("inputPostalCode").bindValue("formData>/recoveredData/postalCode", oPostal);
                oView.byId("inputPhone").bindValue("formData>/recoveredData/phoneNumber", oPhone);
                oView.byId("inputEmail").bindValue("formData>/recoveredData/email", oEmail);

                const oToday = new Date();
                const oBirthDate = new d({
                    pattern: "dd.MM.yyyy"
                }, {
                    constraints: {
                        minimum: new Date("1900-01-01"),
                        maximum: oToday
                    }
                });
                oView.byId("dateBirthDate").bindValue("formData>/recoveredData/birthDate", oBirthDate);

                // los select ya están vinculados por selectedKey en la vista
            },
            /**
             * Valida los campos de tipo select.
             * @private
             * @returns {boolean} Devuelve true si todos los selects son válidos, false en caso contrario.
             */
            _validateSelects: function () {
                const oView = this.getView();
                const aSelectIds = [
                    "slTypeDoc", "slPlaceBirth", "slNationality",
                    "slGender", "slCivilStatus", "slCountry",
                    "slProvince", "slRegion"
                ];

                let bIsValid = true;

                aSelectIds.forEach(sId => {
                    const oSelect = oView.byId(sId);
                    if (!oSelect.getSelectedKey()) {
                        oSelect.setValueState("Error");
                        oSelect.setValueStateText("This field is required.");
                        bIsValid = false;
                    } else {
                        oSelect.setValueState("None");
                    }
                });

                return bIsValid;
            },
            /**
             * Valida los campos de tipo input.
             * @private
             * @returns {boolean} Devuelve true si todos los inputs son válidos, false en caso contrario.
             */
            _validateInputs: function () {
                const oView = this.getView();
                const oModel = oView.getModel("formData");
                const d = oModel.getProperty("/recoveredData");
                let bIsValid = true;

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                const aRequiredFields = [
                    { id: "inputId", path: "ID" },
                    { id: "inputFName", path: "firstName" },
                    { id: "inputLName", path: "lastName" },
                    { id: "inputNumberDoc", path: "numberDocument" },
                    { id: "dateBirthDate", path: "birthDate" },
                    { id: "inputAddress", path: "address" },
                    { id: "inputPostalCode", path: "postalCode" },
                    { id: "inputPhone", path: "phoneNumber" },
                    { id: "inputEmail", path: "email" }
                ];

                aRequiredFields.forEach(field => {
                    const value = d[field.path];
                    const oInput = oView.byId(field.id);

                    if (!value || value.toString().trim() === "") {
                        oInput.setValueState("Error");
                        oInput.setValueStateText("This field is required.");
                        bIsValid = false;
                    } else {
                        oInput.setValueState("None");
                    }
                });

                const oEmailInput = oView.byId("inputEmail");
                if (d.email && !emailRegex.test(d.email)) {
                    oEmailInput.setValueState("Error");
                    oEmailInput.setValueStateText("Invalid email format.");
                    bIsValid = false;
                }

                return bIsValid;
            },
            /**
             * Actualiza el encabezado de la tabla con el número de usuarios.
             * @private
             */
            _updateTableHeader: function () {
                const oTable = this.byId("tUserData");
                const oModel = this.getView().getModel("savedData");
                const aItems = oModel.getProperty("/savedData") || [];
                oTable.setHeaderText(`Users (${aItems.length})`);
            },
            /**
             * Formatea una fecha en el formato MM/DD/YYYY.
             * @private
             * @param {Date|string} oDate Fecha a formatear.
             * @returns {string} Fecha formateada o cadena vacía si no hay fecha.
             */
            _formatDate: function (oDate) {
                if (!oDate) return "";

                const d = new Date(oDate);
                const month = (d.getMonth() + 1).toString().padStart(2, "0");
                const day = d.getDate().toString().padStart(2, "0");
                const year = d.getFullYear();

                return `${month}/${day}/${year}`;
            },
            /**
             * Obtiene el texto correspondiente a una clave (key) dentro de una lista.
             * @private
             * @param {Array} aList Lista de objetos con key y text.
             * @param {string} sKey Clave a buscar en la lista.
             * @returns {string} Texto correspondiente o la misma clave si no se encuentra.
             */
            _getTextFromKey: function (aList, sKey) {
                const oItem = aList.find(item => item.key === sKey);
                return oItem ? oItem.text : sKey;
            },
            /**
             * Limpia todos los campos del modelo recoveredData.
             * @private
             */
            _clearFormData: function () {
                const oModel = this.getView().getModel("formData");
                const oRecoveredData = oModel.getProperty("/recoveredData");
                Object.keys(oRecoveredData).forEach(key => {
                    oRecoveredData[key] = "";
                });
                oModel.setProperty("/recoveredData", oRecoveredData);
            },
            /**
             * Guarda los datos del formulario transformando keys en textos y actualiza la tabla.
             * @private
             */
            _saveData: function () {
                const oFormModel = this.getView().getModel("formData");
                const oRawData = oFormModel.getProperty("/recoveredData");


                const aTypeDocuments = oFormModel.getProperty("/typeDocuments") || [];
                const aCountries = oFormModel.getProperty("/countries") || [];
                const aProvinces = oFormModel.getProperty("/provinces") || [];
                const aRegions = oFormModel.getProperty("/regions") || [];
                const aGenders = oFormModel.getProperty("/genders") || [];
                const aCivilStatus = oFormModel.getProperty("/civilStatus") || [];

                const transformedData = {
                    ID: oRawData.ID,
                    firstName: oRawData.firstName,
                    lastName: oRawData.lastName,
                    email: oRawData.email,
                    typeDocument: this._getTextFromKey(aTypeDocuments, oRawData.typeDocument),
                    numberDocument: oRawData.numberDocument,
                    birthDate: this._formatDate(oRawData.birthDate),
                    placeBirth: this._getTextFromKey(aCountries, oRawData.placeBirth),
                    nationality: this._getTextFromKey(aCountries, oRawData.nationality),
                    gender: this._getTextFromKey(aGenders, oRawData.gender),
                    civilStatus: this._getTextFromKey(aCivilStatus, oRawData.civilStatus),
                    country: this._getTextFromKey(aCountries, oRawData.country),
                    province: this._getTextFromKey(aProvinces, oRawData.province),
                    region: this._getTextFromKey(aRegions, oRawData.region),
                    address: oRawData.address,
                    postalCode: oRawData.postalCode,
                    phoneNumber: oRawData.phoneNumber
                };

                let aExistingData = this.getView().getModel("savedData").getProperty("/savedData") || [];
                const updatedData = aExistingData.concat(transformedData);
                this.getView().getModel("savedData").setProperty("/savedData", updatedData);

                const oTable = this.getView().byId("tUserData");
                oTable.getBinding("items").refresh();
                this._updateTableHeader();
            }
        });
    });