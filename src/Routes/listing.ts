import { Router } from 'express';
import { listingController } from '../controllers';
import { createListing, updateListing, updateListingStatus, getListingById, getListings, validateRequest, validateParams, validateQuery } from '../validation';

const router = Router();

router.post('/add', validateRequest(createListing), listingController.createListing);
router.get('/all', validateQuery(getListings), listingController.getListings);
router.get('/:id', validateParams(getListingById), listingController.getListingById);
router.put('/update', validateRequest(updateListing), listingController.updateListing);
router.patch('/status', validateRequest(updateListingStatus), listingController.updateListingStatus);
router.delete('/:id', validateParams(getListingById), listingController.deleteListing);

export const listingRouter = router;
