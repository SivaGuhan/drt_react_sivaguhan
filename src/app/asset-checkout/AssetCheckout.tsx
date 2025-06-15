import { Button } from "@mui/material";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

interface SatelliteData {
  noradCatId: string;
  intlDes: string;
  name: string;
  launchDate: string;
  decayDate: string;
  objectType: string;
  launchSiteCode: string;
  countryCode: string;
  orbitCode: string;
}

const AssetCheckout: FC = () => {
    const items = localStorage.getItem('assetItems')
    const assetList = items ? JSON.parse(items) : []

    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate('/')
    }

    return (
        <div className="asset-checkout-container">
            <h1 className="main-heading">Your Asset items</h1>
            {assetList.length ? (
                <section className="asset-list-container">
                {assetList.map((item: SatelliteData) => (
                    <div key={item.noradCatId} className="asset-item-wrapper">
                        <p className="norad-cat-id">{item.noradCatId}</p>
                        <p className="asset-name">{item.name}</p>
                    </div>
                ))}
                </section>
            ) : (
                <div className="asset-placeholder">
                    <p className="placeholder-test">Looks like you don't have any assets. Go back to create them</p>
                </div>
            )}
            <div className="footer-container">
                <Button 
                    type="button" 
                    variant="contained" 
                    className="back-button"
                    onClick={handleGoBack}
                >
                        Go Back
                </Button>
            </div>
        </div>
    )
}

export default AssetCheckout;