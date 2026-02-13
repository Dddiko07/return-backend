const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Resi = sequelize.define(
  "resi",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nomor_resi: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    nama_barang: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    nama_toko: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    jasa_kirim: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    sumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    tanggal_scan: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    tanggal_order: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "resi",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Resi;
